import type { User } from '@/types'
import { DEMO_ADMIN, DEMO_STUDENT } from '@/utils/constants'

export const seedUsers: User[] = [
  {
    id: 'user-demo-student',
    fullName: 'Amina Al Hashimi',
    email: DEMO_STUDENT.email,
    mobile: '501234567',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    role: 'student',
    password: DEMO_STUDENT.password,
    createdAt: '2026-06-12T08:00:00.000Z',
    emailPreferences: {
      productUpdates: true,
      courseNotifications: true,
      weeklyDigest: true,
    },
  },
  {
    id: 'user-demo-admin',
    fullName: 'Academy Administrator',
    email: DEMO_ADMIN.email,
    mobile: '509876543',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    role: 'admin',
    password: DEMO_ADMIN.password,
    createdAt: '2026-01-08T08:00:00.000Z',
    emailPreferences: {
      productUpdates: true,
      courseNotifications: true,
      weeklyDigest: false,
    },
  },
  {
    id: 'user-lina',
    fullName: 'Lina Rahman',
    email: 'lina.rahman@example.com',
    mobile: '712345678',
    country: 'United Kingdom',
    countryCode: 'GB',
    role: 'student',
    password: 'Student123!',
    createdAt: '2026-07-02T10:15:00.000Z',
    emailPreferences: {
      productUpdates: false,
      courseNotifications: true,
      weeklyDigest: true,
    },
  },
  {
    id: 'user-omar',
    fullName: 'Omar Farouk',
    email: 'omar.farouk@example.com',
    mobile: '1012345678',
    country: 'Egypt',
    countryCode: 'EG',
    role: 'student',
    password: 'Student123!',
    createdAt: '2026-07-18T12:40:00.000Z',
    emailPreferences: {
      productUpdates: true,
      courseNotifications: false,
      weeklyDigest: false,
    },
  },
]
