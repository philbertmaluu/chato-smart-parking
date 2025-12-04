import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Vehicle type icon mapping helper
export interface VehicleTypeIcon {
  icon: string;
  color: string;
  bgColor: string;
}

export function getVehicleTypeIcon(vehicleType: string): VehicleTypeIcon {
  // Handle null, undefined, or empty string
  if (!vehicleType || typeof vehicleType !== 'string') {
    return {
      icon: "🚗",
      color: "text-gray-600",
      bgColor: "bg-gray-100"
    };
  }
  
  const type = vehicleType.toLowerCase();
  
  switch (type) {
    case "car":
    case "sedan":
    case "hatchback":
      return {
        icon: "🚗",
        color: "text-blue-600",
        bgColor: "bg-blue-100"
      };
    
    case "suv":
    case "4x4":
    case "jeep":
      return {
        icon: "🚙",
        color: "text-green-600",
        bgColor: "bg-green-100"
      };
    
    case "truck":
    case "pickup":
    case "lorry":
    case "heavy vehicle":
    case "large vehicles":
    case "Large Vehicles":
      return {
        icon: "🚛",
        color: "text-orange-600",
        bgColor: "bg-orange-100"
      };
    
    case "bus":
    case "coach":
    case "minibus":
      return {
        icon: "🚌",
        color: "text-purple-600",
        bgColor: "bg-purple-100"
      };
    
    case "motorcycle":
    case "bike":
    case "scooter":
      return {
        icon: "🏍️",
        color: "text-red-600",
        bgColor: "bg-red-100"
      };
    
    case "van":
    case "minivan":
    case "delivery":
      return {
        icon: "🚐",
        color: "text-indigo-600",
        bgColor: "bg-indigo-100"
      };
    
    case "trailer":
    case "caravan":
      return {
        icon: "🚚",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100"
      };
    
    case "tractor":
    case "agricultural":
      return {
        icon: "🚜",
        color: "text-emerald-600",
        bgColor: "bg-emerald-100"
      };
    
    case "ambulance":
    case "emergency":
      return {
        icon: "🚑",
        color: "text-red-600",
        bgColor: "bg-red-100"
      };
    
    case "fire truck":
    case "fire":
      return {
        icon: "🚒",
        color: "text-red-600",
        bgColor: "bg-red-100"
      };
    
    case "police":
    case "law enforcement":
      return {
        icon: "🚓",
        color: "text-blue-600",
        bgColor: "bg-blue-100"
      };
    
    case "taxi":
    case "cab":
      return {
        icon: "🚕",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100"
      };
    
    case "limousine":
    case "limo":
      return {
        icon: "🚗",
        color: "text-gray-600",
        bgColor: "bg-gray-100"
      };
    
    case "racing":
    case "sports car":
      return {
        icon: "🏎️",
        color: "text-red-600",
        bgColor: "bg-red-100"
      };
    
    case "electric":
    case "ev":
    case "tesla":
      return {
        icon: "⚡",
        color: "text-green-600",
        bgColor: "bg-green-100"
      };
    
    case "hybrid":
      return {
        icon: "🔋",
        color: "text-teal-600",
        bgColor: "bg-teal-100"
      };
    
    default:
      return {
        icon: "🚗",
        color: "text-gray-600",
        bgColor: "bg-gray-100"
      };
  }
}

// Helper function to get vehicle type icon with badge styling
export function getVehicleTypeBadge(vehicleType: string) {
  // Handle null, undefined, or empty string
  if (!vehicleType || typeof vehicleType !== 'string') {
    return {
      icon: "🚗",
      className: "bg-gray-100 text-gray-600 p-2 rounded-full text-lg"
    };
  }
  
  const iconData = getVehicleTypeIcon(vehicleType);
  return {
    icon: iconData.icon,
    className: `${iconData.bgColor} ${iconData.color} p-2 rounded-full text-lg`
  };
}

// Payment type icon mapping helper
export interface PaymentTypeIcon {
  icon: string;
  color: string;
  bgColor: string;
}

export function getPaymentTypeIcon(paymentType: string): PaymentTypeIcon {
  // Handle null, undefined, or empty string
  if (!paymentType || typeof paymentType !== 'string') {
    return {
      icon: "💳",
      color: "text-gray-600",
      bgColor: "bg-gray-100"
    };
  }
  
  // Normalize the type: lowercase and replace spaces/hyphens with underscores
  const type = paymentType.toLowerCase().replace(/[\s-]/g, '_');
  
  switch (type) {
    case "cash":
      return {
        icon: "💵",
        color: "text-green-600",
        bgColor: "bg-green-100"
      };
    
    case "card":
    case "credit_card":
    case "debit_card":
    case "credit card":
    case "debit card":
      return {
        icon: "💳",
        color: "text-blue-600",
        bgColor: "bg-blue-100"
      };
    
    case "mobile_money":
    case "mobile money":
    case "mobilemoney":
    case "m_pesa":
    case "mpesa":
    case "airtel_money":
    case "airtel money":
      return {
        icon: "📱",
        color: "text-purple-600",
        bgColor: "bg-purple-100"
      };
    
    case "account_balance":
    case "account balance":
    case "balance":
    case "wallet":
      return {
        icon: "🏦",
        color: "text-indigo-600",
        bgColor: "bg-indigo-100"
      };
    
    case "bundle":
    case "subscription":
    case "package":
      return {
        icon: "📦",
        color: "text-orange-600",
        bgColor: "bg-orange-100"
      };
    
    case "bank_transfer":
    case "bank transfer":
    case "transfer":
    case "wire_transfer":
    case "wire transfer":
      return {
        icon: "🏛️",
        color: "text-teal-600",
        bgColor: "bg-teal-100"
      };
    
    case "crypto":
    case "cryptocurrency":
    case "bitcoin":
    case "btc":
    case "ethereum":
    case "eth":
      return {
        icon: "₿",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100"
      };
    
    case "paypal":
    case "pay_pal":
      return {
        icon: "💰",
        color: "text-blue-600",
        bgColor: "bg-blue-100"
      };
    
    case "apple_pay":
    case "apple pay":
    case "applepay":
      return {
        icon: "🍎",
        color: "text-gray-800",
        bgColor: "bg-gray-100"
      };
    
    case "google_pay":
    case "google pay":
    case "googlepay":
    case "gpay":
      return {
        icon: "🔴",
        color: "text-red-600",
        bgColor: "bg-red-100"
      };
    
    case "check":
    case "cheque":
    case "bank_check":
    case "bank check":
      return {
        icon: "📝",
        color: "text-brown-600",
        bgColor: "bg-brown-100"
      };
    
    default:
      return {
        icon: "💳",
        color: "text-gray-600",
        bgColor: "bg-gray-100"
      };
  }
}

// Helper function to get payment type icon with badge styling
export function getPaymentTypeBadge(paymentType: string) {
  // Handle null, undefined, or empty string
  if (!paymentType || typeof paymentType !== 'string') {
    return {
      icon: "💳",
      className: "bg-gray-100 text-gray-600 p-2 rounded-full text-lg"
    };
  }
  
  const iconData = getPaymentTypeIcon(paymentType);
  return {
    icon: iconData.icon,
    className: `${iconData.bgColor} ${iconData.color} p-2 rounded-full text-lg`
  };
}

// Gate type icon mapping helper
export interface GateTypeIcon {
  icon: string;
  color: string;
  bgColor: string;
}

export function getGateTypeIcon(gateType: string): GateTypeIcon {
  if (!gateType || typeof gateType !== 'string') {
    return { icon: "↔️", color: "text-gray-700", bgColor: "bg-gray-100" };
  }
  const type = gateType.toLowerCase();
  switch (type) {
    case "entry":
      return { icon: "⬅️", color: "text-green-700", bgColor: "bg-green-100" };
    case "exit":
      return { icon: "➡️", color: "text-red-700", bgColor: "bg-red-100" };
    case "both":
    default:
      return { icon: "↔️", color: "text-indigo-700", bgColor: "bg-indigo-100" };
  }
}

export function getGateTypeBadge(gateType: string) {
  const icon = getGateTypeIcon(gateType);
  return {
    icon: icon.icon,
    className: `${icon.bgColor} ${icon.color} p-2 rounded-full text-lg`,
  };
}
