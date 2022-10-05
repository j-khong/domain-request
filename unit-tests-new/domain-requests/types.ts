export type DomainRequestName =
   // simple domains
   | 'sponsor'
   | 'country'
   | 'course'
   | 'studentCategory'
   // domains with expandables
   | 'building'
   | 'buildingCategory'
   // wihth 1to1 chain
   | 'architect';
// | 'student'
// pure joining Domains
// | 'buildingSponsor' // building - sponsor
// | 'courseApplication'; // course - student

export type Role = 'admin' | 'student';
