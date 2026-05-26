export type Category = 'food' | 'sightseeing' | 'transport' | 'shopping' | 'hotel' | 'other';
export type ExpenseCategory = 'transport' | 'food' | 'hotel' | 'ticket' | 'shopping' | 'other';

export interface Spot {
  id: string;
  time: string;
  location: string;
  locationJp?: string;
  category: Category;
  description: string;
  travelTimeNext?: string;
  stayDuration?: string;
  openingHours?: string;
  recommendedMenuJp?: string;
  recommendedMenuCn?: string;
  recommendedMenuItems?: { id: string; name: string; completed: boolean; image?: string }[];
  menuImage?: string;
  images?: string[];
  ticketPrice?: number;
  ticketPriceTwd?: string;
  ticketCurrency?: 'JPY' | 'TWD';
  cardAccepted?: string;
  story?: string;
  guideText?: string;
  notes?: string;
  notesImage?: string;
  shoppingGuide?: string;
  nearbyFood?: { name: string; image?: string; mapUrl?: string }[];
  googleMapUrl?: string;
  address?: string;
  phone?: string;
  reservationRequired?: boolean;
  aiInsight?: string;
}

export interface DayPlan {
  id: string;
  date: string;
  title: string;
  location: string;
  city?: string;
  spots: Spot[];
  notes?: string;
  weather?: {
    temp: string;
    condition: string;
    icon: string;
    rainProb?: string;
    sunrise?: string;
    sunset?: string;
    hourly?: { time: string; temp: string; icon: string; rainProb?: string; precipitation?: string }[];
  };
}

export interface Expense {
  id: string;
  name: string;
  date: string;
  amount: number;
  currency: 'JPY' | 'TWD';
  paymentMethod: 'cash' | 'credit';
  category: ExpenseCategory;
  notes?: string;
  images?: string[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  image?: string;
  remarks: string;
  link?: string;
  completed: boolean;
  category?: 'pharmacy' | 'gift' | 'supermarket' | 'apparel' | 'grocery' | 'other' | 'muji' | 'gu' | 'uq';
  convenienceStores?: string[];
}

export interface PackingItem {
  id: string;
  name: string;
  quantity: number;
  category: 'carry-on' | 'checked';
  completed: boolean;
}

export interface FlightInfo {
  id: string;
  type: 'departure' | 'transit' | 'return';
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  duration?: string;
  baggageWeight?: string;
  ticketUrl?: string;
}

export interface HotelInfo {
  id: string;
  name: string;
  address: string;
  phone?: string;
  navUrl?: string;
  checkIn: string;
  checkOut: string;
  orderUrl?: string;
  bookingUrl?: string;
  remarks?: string;
}

export interface TransportOrder {
  id: string;
  name: string;
  date?: string;
  time?: string;
  location?: string;
  url?: string;
  remarks?: string;
  images?: string[];
}

export interface ItineraryData {
  title: string;
  subtitle?: string;
  year: string;
  dateRange: string;
  days: DayPlan[];
  expenses: Expense[];
  shoppingList: ShoppingItem[];
  packingList: PackingItem[];
  flights: FlightInfo[];
  hotels: HotelInfo[];
  transportOrders: TransportOrder[];
  convenienceStoreList: ShoppingItem[];
}
