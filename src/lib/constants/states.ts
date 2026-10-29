/**
 * @file Indian states and Union Territories relevant to Adivasi/tribal populations.
 * Contains state definitions with their major tribal districts, along with helper utilities.
 */

/** Represents an Indian state or Union Territory with its key tribal districts. */
export interface IndianState {
  /** Full name of the state or Union Territory */
  readonly name: string;
  /** Top tribal districts within the state (8–15 entries) */
  readonly districts: readonly string[];
}

/**
 * Indian states and Union Territories with significant Adivasi/tribal populations
 * and their major tribal districts.
 */
export const INDIAN_STATES: readonly IndianState[] = [
  {
    name: 'Odisha',
    districts: [
      'Mayurbhanj', 'Sundargarh', 'Koraput', 'Rayagada', 'Kandhamal',
      'Malkangiri', 'Nabarangpur', 'Keonjhar', 'Gajapati', 'Kalahandi',
      'Nuapada', 'Balangir', 'Sambalpur', 'Jharsuguda',
    ],
  },
  {
    name: 'Jharkhand',
    districts: [
      'Ranchi', 'West Singhbhum', 'East Singhbhum', 'Gumla', 'Lohardaga',
      'Simdega', 'Khunti', 'Dumka', 'Pakur', 'Sahebganj',
      'Godda', 'Latehar', 'Palamu',
    ],
  },
  {
    name: 'Chhattisgarh',
    districts: [
      'Bastar', 'Dantewada', 'Bijapur', 'Sukma', 'Narayanpur',
      'Kanker', 'Kondagaon', 'Jashpur', 'Surguja', 'Korba',
      'Koriya', 'Balrampur', 'Gariaband', 'Kabirdham',
    ],
  },
  {
    name: 'Madhya Pradesh',
    districts: [
      'Jhabua', 'Alirajpur', 'Barwani', 'Dhar', 'Mandla',
      'Dindori', 'Shahdol', 'Anuppur', 'Betul', 'Chhindwara',
      'Seoni', 'Balaghat', 'Khandwa', 'Khargone',
    ],
  },
  {
    name: 'Gujarat',
    districts: [
      'Dahod', 'Panchmahal', 'Narmada', 'Tapi', 'Dang',
      'Valsad', 'Navsari', 'Bharuch', 'Sabarkantha', 'Aravalli',
      'Banaskantha', 'Chhota Udaipur',
    ],
  },
  {
    name: 'Rajasthan',
    districts: [
      'Banswara', 'Dungarpur', 'Pratapgarh', 'Udaipur', 'Sirohi',
      'Pali', 'Rajsamand', 'Bhilwara', 'Chittorgarh', 'Baran',
    ],
  },
  {
    name: 'Maharashtra',
    districts: [
      'Nandurbar', 'Nashik', 'Thane', 'Palghar', 'Dhule',
      'Gadchiroli', 'Chandrapur', 'Amravati', 'Yavatmal', 'Nanded',
      'Raigad', 'Pune',
    ],
  },
  {
    name: 'West Bengal',
    districts: [
      'Jhargram', 'Paschim Medinipur', 'Bankura', 'Purulia', 'Birbhum',
      'Malda', 'Dakshin Dinajpur', 'Uttar Dinajpur', 'Jalpaiguri',
      'Alipurduar', 'Cooch Behar',
    ],
  },
  {
    name: 'Andhra Pradesh',
    districts: [
      'Visakhapatnam', 'Srikakulam', 'Vizianagaram', 'East Godavari',
      'West Godavari', 'Prakasam', 'Kurnool', 'Anantapur',
    ],
  },
  {
    name: 'Telangana',
    districts: [
      'Adilabad', 'Kumuram Bheem Asifabad', 'Mancherial', 'Nirmal',
      'Khammam', 'Bhadradri Kothagudem', 'Jayashankar Bhupalpally',
      'Mulugu', 'Mahabubabad', 'Warangal',
    ],
  },
  {
    name: 'Assam',
    districts: [
      'Karbi Anglong', 'Dima Hasao', 'West Karbi Anglong', 'Kokrajhar',
      'Chirang', 'Baksa', 'Udalguri', 'Sonitpur', 'Lakhimpur',
      'Dhemaji', 'Tinsukia', 'Dibrugarh',
    ],
  },
  {
    name: 'Meghalaya',
    districts: [
      'East Khasi Hills', 'West Khasi Hills', 'South West Khasi Hills',
      'Ri Bhoi', 'East Jaintia Hills', 'West Jaintia Hills',
      'East Garo Hills', 'West Garo Hills', 'South Garo Hills',
      'North Garo Hills', 'South West Garo Hills',
    ],
  },
  {
    name: 'Nagaland',
    districts: [
      'Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Mon',
      'Wokha', 'Zunheboto', 'Phek', 'Longleng', 'Kiphire',
      'Peren', 'Noklak',
    ],
  },
  {
    name: 'Manipur',
    districts: [
      'Churachandpur', 'Senapati', 'Tamenglong', 'Ukhrul', 'Chandel',
      'Kangpokpi', 'Noney', 'Pherzawl', 'Tengnoupal', 'Kamjong',
    ],
  },
  {
    name: 'Mizoram',
    districts: [
      'Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib',
      'Lawngtlai', 'Saiha', 'Mamit', 'Khawzawl', 'Hnahthial', 'Saitual',
    ],
  },
  {
    name: 'Tripura',
    districts: [
      'Dhalai', 'North Tripura', 'South Tripura', 'West Tripura',
      'Gomati', 'Khowai', 'Sipahijala', 'Unakoti',
    ],
  },
  {
    name: 'Arunachal Pradesh',
    districts: [
      'Tawang', 'West Kameng', 'East Kameng', 'Papum Pare', 'Lower Subansiri',
      'Upper Subansiri', 'West Siang', 'East Siang', 'Upper Siang',
      'Changlang', 'Tirap', 'Longding', 'Namsai', 'Lohit',
    ],
  },
  {
    name: 'Sikkim',
    districts: [
      'East Sikkim', 'West Sikkim', 'North Sikkim', 'South Sikkim',
      'Pakyong', 'Soreng', 'Gyalshing', 'Namchi',
    ],
  },
  {
    name: 'Kerala',
    districts: [
      'Wayanad', 'Idukki', 'Palakkad', 'Kasaragod', 'Kannur',
      'Malappuram', 'Thrissur', 'Ernakulam',
    ],
  },
  {
    name: 'Karnataka',
    districts: [
      'Mysuru', 'Kodagu', 'Chamarajanagar', 'Raichur', 'Yadgir',
      'Bellary', 'Kalaburagi', 'Belagavi', 'Dakshina Kannada',
      'Uttara Kannada', 'Haveri', 'Chikkamagaluru',
    ],
  },
  {
    name: 'Tamil Nadu',
    districts: [
      'Nilgiris', 'Dharmapuri', 'Krishnagiri', 'Salem', 'Erode',
      'Tiruvannamalai', 'Villupuram', 'Vellore', 'Coimbatore',
    ],
  },
  {
    name: 'Bihar',
    districts: [
      'Jamui', 'Banka', 'Munger', 'Bhagalpur', 'Katihar',
      'Purnia', 'West Champaran', 'East Champaran', 'Gaya',
    ],
  },
  {
    name: 'Uttarakhand',
    districts: [
      'Dehradun', 'Haridwar', 'Udham Singh Nagar', 'Nainital',
      'Pithoragarh', 'Chamoli', 'Uttarkashi', 'Tehri Garhwal',
    ],
  },
  {
    name: 'Himachal Pradesh',
    districts: [
      'Chamba', 'Lahaul and Spiti', 'Kinnaur', 'Shimla',
      'Kullu', 'Mandi', 'Sirmaur', 'Kangra',
    ],
  },
] as const;

/**
 * Returns the list of tribal districts for a given state name.
 * Performs a case-insensitive lookup.
 *
 * @param stateName - The full name of the state
 * @returns Array of district names, or an empty array if the state is not found
 *
 * @example
 * ```ts
 * const districts = getDistrictsByState('Odisha');
 * // ['Mayurbhanj', 'Sundargarh', 'Koraput', ...]
 * ```
 */
export function getDistrictsByState(stateName: string): string[] {
  const normalised = stateName.trim().toLowerCase();
  const state = INDIAN_STATES.find(
    (s) => s.name.toLowerCase() === normalised,
  );
  return state ? [...state.districts] : [];
}
