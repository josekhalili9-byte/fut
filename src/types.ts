export interface Product {
  id?: string;
  name: string;
  team: string;
  league: string;
  season: string;
  price: number;
  description: string;
  stock: number;
  category: string;
  imageUrl: string;
  allowCustomName: boolean;
  allowCustomNumber: boolean;
  allowPatches: boolean;
  availablePatches: string[];
  createdAt: any;
  updatedAt: any;
}

export interface OrderItem {
  productId: string;
  name: string;
  team: string;
  league: string;
  season: string;
  price: number;
  size: string;
  customName?: string;
  customNumber?: string;
  selectedPatch?: string;
}

export interface Order {
  id?: string;
  userId: string;
  orderNumber: string;
  status: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  department: string;
  city: string;
  zipCode: string;
  notes: string;
  items: string[]; // JSON stringified OrderItem[]
  totalPrice: number;
  createdAt: any;
  updatedAt: any;
}

export interface FavoriteItem {
  id?: string;
  productId: string;
  createdAt: any;
}

export interface SiteSettings {
  discountActive: boolean;
  discountPercentage: number;
  promoText: string;
  bannerText: string;
}

export const CATEGORIES = [
  "Premier League",
  "LaLiga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Otras ligas",
  "Selecciones",
  "Sudaderas",
  "Playeras Retro",
  "Próximamente"
];

export const ORDER_STATUSES = [
  "Pendiente",
  "Preparando",
  "Enviado",
  "Entregado",
  "Cancelado"
];
