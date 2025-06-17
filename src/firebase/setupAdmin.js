import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

export const setupAdminUser = async () => {
  try {
    // Create admin user with email and password
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'Admin@12';

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminEmail,
      adminPassword
    );

    // Add admin user to admins collection
    await setDoc(doc(db, 'admins', userCredential.user.uid), {
      email: adminEmail,
      role: 'admin',
      createdAt: new Date()
    });

    console.log('Admin user created successfully');
    return true;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists');
      return true;
    }
    console.error('Error creating admin user:', error);
    return false;
  }
}; 