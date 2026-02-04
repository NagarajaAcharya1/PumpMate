import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const AUTH_LOGOUT_EVENT = 'auth:logout';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'worker';
  position?: string;
  dutyType?: string;
  baseSalary?: number;
  stationId: string;
}

interface Station {
  id: string;
  name: string;
  brand: string;
  address: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  prices: {
    petrol: number;
    diesel: number;
  };
  createdAt: any;
}

export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }
      
      const userData = userDoc.data() as User;
      const stationDoc = await getDoc(doc(db, 'stations', userData.stationId));
      
      if (!stationDoc.exists()) {
        throw new Error('Station data not found');
      }
      
      return {
        data: {
          user: userData,
          station: stationDoc.data() as Station,
          token: await user.getIdToken()
        }
      };
    } catch (error: any) {
      throw { response: { data: { error: error.message } } };
    }
  },
  
  register: async (userData: { name: string; email: string; password: string; role: string; stationData?: any }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;
      
      let stationId = '';
      
      if (userData.role === 'admin' && userData.stationData) {
        const stationRef = doc(collection(db, 'stations'));
        stationId = stationRef.id;
        
        await setDoc(stationRef, {
          id: stationId,
          name: userData.stationData.name,
          brand: userData.stationData.brand,
          address: userData.stationData.address,
          theme: {
            primaryColor: '#1e40af',
            secondaryColor: '#3b82f6'
          },
          prices: {
            petrol: 100,
            diesel: 95
          },
          createdAt: serverTimestamp()
        });
      }
      
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        stationId,
        createdAt: serverTimestamp()
      });
      
      return { data: { success: true } };
    } catch (error: any) {
      throw { response: { data: { error: error.message } } };
    }
  },
  
  verifySession: async () => {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
              reject({ response: { data: { error: 'User data not found' } } });
              return;
            }
            
            const userData = userDoc.data() as User;
            const stationDoc = await getDoc(doc(db, 'stations', userData.stationId));
            
            resolve({
              data: {
                user: userData,
                station: stationDoc.exists() ? stationDoc.data() : null
              }
            });
          } catch (error) {
            reject({ response: { data: { error: 'Session verification failed' } } });
          }
        } else {
          reject({ response: { data: { error: 'No user logged in' } } });
        }
      });
    });
  },
  
  logout: async () => {
    await signOut(auth);
  }
};

export const dutyAPI = {
  startDuty: async (pumpReadings: any) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const dutyRef = doc(collection(db, 'duties'));
    await setDoc(dutyRef, {
      id: dutyRef.id,
      workerId: user.uid,
      pumpReadings,
      startTime: serverTimestamp(),
      status: 'active'
    });
    
    return { data: { id: dutyRef.id } };
  },
  
  endDuty: async (dutyId: string, data: any) => {
    await updateDoc(doc(db, 'duties', dutyId), {
      ...data,
      endTime: serverTimestamp(),
      status: 'completed'
    });
    
    return { data: { success: true } };
  },
  
  getMyDuties: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    try {
      // Try simple query first (no ordering)
      const q = query(
        collection(db, 'duties'),
        where('workerId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      const duties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort in memory instead of Firestore
      duties.sort((a, b) => {
        const aTime = a.startTime?.toDate?.() || new Date(a.startTime || 0);
        const bTime = b.startTime?.toDate?.() || new Date(b.startTime || 0);
        return bTime.getTime() - aTime.getTime();
      });
      
      return { data: duties };
    } catch (error: any) {
      console.error('Error fetching duties:', error);
      throw error;
    }
  },
  
  getAllDuties: async () => {
    const q = query(collection(db, 'duties'), orderBy('startTime', 'desc'));
    const snapshot = await getDocs(q);
    const duties = snapshot.docs.map(doc => doc.data());
    
    return { data: duties };
  }
};

export const stationAPI = {
  getStation: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) throw new Error('User not found');
    
    const userData = userDoc.data() as User;
    const stationDoc = await getDoc(doc(db, 'stations', userData.stationId));
    
    return { data: stationDoc.data() };
  },
  
  updateStation: async (data: any) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) throw new Error('User not found');
    
    const userData = userDoc.data() as User;
    await updateDoc(doc(db, 'stations', userData.stationId), data);
    
    return { data: { success: true } };
  }
};

export const workerAPI = {
  getWorkers: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) throw new Error('User not found');
    
    const userData = userDoc.data() as User;
    const q = query(
      collection(db, 'users'),
      where('stationId', '==', userData.stationId),
      where('role', '==', 'worker')
    );
    
    const snapshot = await getDocs(q);
    const workers = snapshot.docs.map(doc => doc.data());
    
    return { data: workers };
  },
  
  getWorker: async (id: string) => {
    const workerDoc = await getDoc(doc(db, 'users', id));
    return { data: workerDoc.data() };
  },
  
  createWorker: async (data: any) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) throw new Error('User not found');
    
    const userData = userDoc.data() as User;
    const currentUserEmail = userData.email;
    
    try {
      // Create Firebase Auth user
      const workerCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const workerUser = workerCredential.user;
      
      // Create Firestore document for worker
      await setDoc(doc(db, 'users', workerUser.uid), {
        id: workerUser.uid,
        name: data.name,
        email: data.email,
        role: 'worker',
        position: data.position,
        duty_type: data.duty_type,
        base_salary: data.base_salary,
        phone: data.phone,
        is_active: true,
        stationId: userData.stationId,
        createdAt: serverTimestamp()
      });
      
      // Sign out the worker and sign back in as admin
      await signOut(auth);
      
      // Re-authenticate as admin (you'll need to handle this in the component)
      return { data: { id: workerUser.uid, needsReauth: true, adminEmail: currentUserEmail } };
      
    } catch (error: any) {
      // If worker creation fails, make sure admin stays logged in
      throw error;
    }
  },
  
  updateWorker: async (id: string, data: any) => {
    await updateDoc(doc(db, 'users', id), data);
    return { data: { success: true } };
  },
  
  toggleWorkerStatus: async (id: string) => {
    const workerDoc = await getDoc(doc(db, 'users', id));
    if (workerDoc.exists()) {
      const currentActive = workerDoc.data().is_active !== false;
      await updateDoc(doc(db, 'users', id), {
        is_active: !currentActive
      });
    }
    return { data: { success: true } };
  },
  
  deleteWorker: async (id: string) => {
    await deleteDoc(doc(db, 'users', id));
    return { data: { success: true } };
  }
};

export const helperAPI = {
  getHelpers: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) throw new Error('User not found');
    
    const userData = userDoc.data() as User;
    const q = query(
      collection(db, 'helpers'),
      where('stationId', '==', userData.stationId)
    );
    
    const snapshot = await getDocs(q);
    const helpers = snapshot.docs.map(doc => doc.data());
    
    return { data: helpers };
  },
  
  createHelper: async (data: any) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) throw new Error('User not found');
    
    const userData = userDoc.data() as User;
    
    const helperRef = doc(collection(db, 'helpers'));
    await setDoc(helperRef, {
      id: helperRef.id,
      ...data,
      stationId: userData.stationId,
      createdAt: serverTimestamp()
    });
    
    return { data: { id: helperRef.id } };
  },
  
  deleteHelper: async (id: string) => {
    await deleteDoc(doc(db, 'helpers', id));
    return { data: { success: true } };
  }
};

export const dailySalesAPI = {
  getDailySales: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) throw new Error('User not found');
    
    const userData = userDoc.data() as User;
    const q = query(
      collection(db, 'dailySales'),
      where('stationId', '==', userData.stationId),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const sales = snapshot.docs.map(doc => doc.data());
    
    return { data: sales };
  },
  
  createDailySales: async (data: any) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) throw new Error('User not found');
    
    const userData = userDoc.data() as User;
    
    const salesRef = doc(collection(db, 'dailySales'));
    await setDoc(salesRef, {
      id: salesRef.id,
      ...data,
      stationId: userData.stationId,
      createdAt: serverTimestamp()
    });
    
    return { data: { id: salesRef.id } };
  }
};

export const attendanceAPI = {
  getManualAttendance: async (date: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) throw new Error('User not found');
    
    const userData = userDoc.data() as User;
    const q = query(
      collection(db, 'attendance'),
      where('stationId', '==', userData.stationId),
      where('date', '==', date)
    );
    
    const snapshot = await getDocs(q);
    const attendance = snapshot.docs.map(doc => doc.data());
    
    return { data: attendance };
  },
  
  saveManualAttendance: async (date: string, attendance: any[]) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) throw new Error('User not found');
    
    const userData = userDoc.data() as User;
    
    const batch = writeBatch(db);
    
    attendance.forEach((record) => {
      const attendanceRef = doc(collection(db, 'attendance'));
      batch.set(attendanceRef, {
        id: attendanceRef.id,
        ...record,
        date,
        stationId: userData.stationId,
        createdAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    return { data: { success: true } };
  }
};

export default { authAPI, dutyAPI, stationAPI, workerAPI, helperAPI, dailySalesAPI, attendanceAPI };
