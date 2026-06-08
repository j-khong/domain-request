const domainRequestNames = [
   // simple domains
   //  'sponsor',
   'country',
   //  'course',
   //  'studentCategory',
   // domains with expandables
   //  'building',
   //  'buildingCategory',
   // wihth 1to1 chain
   'architect',
   //  'student',
   // pure joining Domains
   //  'buildingSponsor', // building - sponsor
   //  'courseApplication',; // course - student] as const;
] as const;
export type DomainRequestName = typeof domainRequestNames[number];
export function getDomainRequestName(): DomainRequestName[] {
   return domainRequestNames.map((o) => o);
}

const roles = ['admin', 'student'] as const;
export type Role = typeof roles[number];
export function getRoles(): Role[] {
   return roles.map((o) => o);
}
