export type DomainRequestName =
   // simple domains
   | 'sponsor'
   | 'country'
   | 'course'
   | 'studentCategory'
   // domains with expandables
   | 'building'
   // | 'student';
   // pure joining Domains
   | 'buildingSponsor'; // building - sponsor
// | 'courseApplication' // course - student

export type Role = 'admin' | 'student';
