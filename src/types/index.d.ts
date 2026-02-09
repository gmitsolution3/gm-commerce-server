export interface CreateUser {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phone: string;
  password: string;
  agreeTerms: string;
  createdAt: Date;
  updatedAt: string;
}

// export interface IVisitorLog {
//   ip: string | undefined;
//   userAgent?: string | undefined;
//   updatedAt: Date;
//   createdAt: Date;
//   route: string | undefined;
//   timeSpent: number | undefined;
//   // Ensure this is explicitly defined as an array of objects
//   paths: Array<{
//     route: string | undefined;
//     timeSpent: number | undefined;
//     lastVisit: Date;
//   }>;
// }

interface VisitorPath {
  route: string;
  timeSpent: number;
  lastVisit: Date;
}

interface VisitorDoc {
  ip: string;
  paths: VisitorPath[];
  userAgent?: string;
  createdAt: Date;
  updatedAt?: Date;
}