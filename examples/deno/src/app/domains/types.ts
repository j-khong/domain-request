export type DomainRequestName = // simple domains
// | 'sponsor'
'country';
// | 'course'
// | 'studentCategory'
// domains with expandables
// | 'building'
// | 'buildingCategory'
// wihth 1to1 chain
// | 'architect';
// | 'student'
// pure joining Domains
// | 'buildingSponsor' // building - sponsor
// | 'courseApplication'; // course - student

const roles = ['admin', 'student'] as const;
export type Role = typeof roles[number];
export function getRoles(): Role[] {
   return roles.map((o) => o);
}
