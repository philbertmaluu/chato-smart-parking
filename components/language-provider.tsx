"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "sw";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.vehicles": "Vehicles",
    "nav.vehicleFleet": "Vehicle Fleet",
    "nav.entry": "Entry",
    "nav.parked": "Parked",
    "nav.history": "Passage History",
    "nav.bundles": "Manage Bundles",
    "nav.bundleSubscriptions": "Bundle Subscriptions",
    "nav.accounts": "Customer Accounts",
    "nav.analytics": "Analytics",
    "nav.operators": "Operators",
    "nav.customers": "Customers",
    "nav.detectionLogs": "Detection Logs",
    "nav.settings": "Settings",
    "nav.logout": "Logout",

    // Auth
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm Password",
    "auth.forgotPassword": "Forgot Password?",
    "auth.resetPassword": "Reset Password",
    "auth.role": "Role",
    "auth.operator": "Operator",
    "auth.manager": "Manager",

    // Dashboard
    "dashboard.welcome": "Welcome",
    "dashboard.totalParked": "Total Parked",
    "dashboard.todayRevenue": "Today's Revenue",
    "dashboard.totalEntries": "Total Entries",
    "dashboard.availableSpots": "Available Spots",

    // Vehicle Entry
    "entry.scanPlate": "Scan License Plate",
    "entry.manualEntry": "Manual Entry",
    "entry.plateNumber": "Plate Number",
    "entry.vehicleType": "Vehicle Type",
    "entry.car": "Car",
    "entry.motorcycle": "Motorcycle",
    "entry.truck": "Truck",
    "entry.registerVehicle": "Register Vehicle",
    "entry.generateReceipt": "Generate Receipt",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.export": "Export",
    "common.loading": "Loading...",
    "common.noData": "No data available",
    "common.refresh": "Refresh",
    "common.view": "View",
    "common.actions": "Actions",

    // Detection Logs
    "detectionLogs.title": "Detection Logs",
    "detectionLogs.description": "View camera detection logs and vehicle plate recognition data",
    "detectionLogs.id": "ID",
    "detectionLogs.timestamp": "Timestamp",
    "detectionLogs.plateNumber": "Plate Number",
    "detectionLogs.originalPlate": "Original Plate",
    "detectionLogs.country": "Country",
    "detectionLogs.confidence": "Confidence",
    "detectionLogs.lane": "Lane",
    "detectionLogs.speed": "Speed",
    "detectionLogs.totalDetections": "Total Detections",
    "detectionLogs.allTime": "All time",
    "detectionLogs.currentView": "Current View",
    "detectionLogs.filteredResults": "Filtered results",
    "detectionLogs.avgConfidence": "Avg Confidence",
    "detectionLogs.accuracy": "Detection accuracy",
    "detectionLogs.uniquePlates": "Unique Plates",
    "detectionLogs.distinctVehicles": "Distinct vehicles",
    "detectionLogs.searchPlaceholder": "Search by plate number, country...",
    "detectionLogs.details": "Detection Details",
    "detectionLogs.detailsDescription": "Complete information about this detection",
    "detectionLogs.basicInfo": "Basic Information",
    "detectionLogs.detectionInfo": "Detection Information",
    "detectionLogs.vehicleInfo": "Vehicle Information",
    "detectionLogs.imageInfo": "Image Information",
    "detectionLogs.processTime": "Process Time",
    "detectionLogs.direction": "Direction",
    "detectionLogs.entry": "Entry",
    "detectionLogs.exit": "Exit",
    "detectionLogs.make": "Make",
    "detectionLogs.model": "Model",
    "detectionLogs.color": "Color",
    "detectionLogs.vehicleClass": "Vehicle Class",
    "detectionLogs.resolution": "Resolution",
    "detectionLogs.imagePath": "Image Path",
    "detectionLogs.retailPath": "Retail Path",
  },
  sw: {
    // Navigation
    "nav.dashboard": "Dashibodi",
    "nav.vehicles": "Magari",
    "nav.vehicleFleet": "Kikosi cha Magari",
    "nav.entry": "Kuingia",
    "nav.parked": "Yaliyoegeshwa",
    "nav.history": "Historia ya Kupita",
    "nav.analytics": "Uchambuzi",
    "nav.operators": "Waendeshaji",
    "nav.customers": "Wateja",
    "nav.bundles": "Simamia vifurushi",
    "nav.bundleSubscriptions": "Usajili wa Vifurushi",
    "nav.accounts": "Akaunti za Wateja",
    "nav.detectionLogs": "Nyaraka za Uchunguzi",
    "nav.stations": "Kijiji",
    "nav.settings": "Mipangilio",
    "nav.logout": "Toka",

    // Auth
    "auth.login": "Ingia",
    "auth.register": "Jisajili",
    "auth.email": "Barua pepe",
    "auth.password": "Nenosiri",
    "auth.confirmPassword": "Thibitisha Nenosiri",
    "auth.forgotPassword": "Umesahau Nenosiri?",
    "auth.resetPassword": "Weka Nenosiri Jipya",
    "auth.role": "Jukumu",
    "auth.operator": "Mwendeshaji",
    "auth.manager": "Meneja",

    // Dashboard
    "dashboard.welcome": "Karibu",
    "dashboard.totalParked": "Jumla ya Magari",
    "dashboard.todayRevenue": "Mapato ya Leo",
    "dashboard.totalEntries": "Jumla ya Kuingia",
    "dashboard.availableSpots": "Nafasi Zilizopo",

    // Vehicle Entry
    "entry.scanPlate": "Changanua Nambari ya Gari",
    "entry.manualEntry": "Kuingiza kwa Mkono",
    "entry.plateNumber": "Nambari ya Gari",
    "entry.vehicleType": "Aina ya Gari",
    "entry.car": "Gari",
    "entry.motorcycle": "Pikipiki",
    "entry.truck": "Lori",
    "entry.registerVehicle": "Sajili Gari",
    "entry.generateReceipt": "Tengeneza Risiti",

    // Common
    "common.save": "Hifadhi",
    "common.cancel": "Ghairi",
    "common.delete": "Futa",
    "common.edit": "Hariri",
    "common.add": "Ongeza",
    "common.search": "Tafuta",
    "common.filter": "Chuja",
    "common.export": "Hamisha",
    "common.loading": "Inapakia...",
    "common.noData": "Hakuna data",
    "common.refresh": "Onyesha Upya",
    "common.view": "Angalia",
    "common.actions": "Vitendo",

    // Detection Logs
    "detectionLogs.title": "Nyaraka za Uchunguzi",
    "detectionLogs.description": "Angalia nyaraka za uchunguzi wa kamera na data ya kutambua nambari za magari",
    "detectionLogs.id": "Kitambulisho",
    "detectionLogs.timestamp": "Muda",
    "detectionLogs.plateNumber": "Nambari ya Gari",
    "detectionLogs.originalPlate": "Nambari ya Asili",
    "detectionLogs.country": "Nchi",
    "detectionLogs.confidence": "Kujiamini",
    "detectionLogs.lane": "Njia",
    "detectionLogs.speed": "Kasi",
    "detectionLogs.totalDetections": "Jumla ya Uchunguzi",
    "detectionLogs.allTime": "Wakati wote",
    "detectionLogs.currentView": "Mtazamo wa Sasa",
    "detectionLogs.filteredResults": "Matokeo yaliyochujwa",
    "detectionLogs.avgConfidence": "Wastani wa Kujiamini",
    "detectionLogs.accuracy": "Usahihi wa uchunguzi",
    "detectionLogs.uniquePlates": "Nambari za Kipekee",
    "detectionLogs.distinctVehicles": "Magari tofauti",
    "detectionLogs.searchPlaceholder": "Tafuta kwa nambari ya gari, nchi...",
    "detectionLogs.details": "Maelezo ya Uchunguzi",
    "detectionLogs.detailsDescription": "Taarifa kamili kuhusu uchunguzi huu",
    "detectionLogs.basicInfo": "Taarifa za Msingi",
    "detectionLogs.detectionInfo": "Taarifa za Uchunguzi",
    "detectionLogs.vehicleInfo": "Taarifa za Gari",
    "detectionLogs.imageInfo": "Taarifa za Picha",
    "detectionLogs.processTime": "Muda wa Usindikaji",
    "detectionLogs.direction": "Mwelekeo",
    "detectionLogs.entry": "Kuingia",
    "detectionLogs.exit": "Kutoka",
    "detectionLogs.make": "Chaguzi",
    "detectionLogs.model": "Muundo",
    "detectionLogs.color": "Rangi",
    "detectionLogs.vehicleClass": "Aina ya Gari",
    "detectionLogs.resolution": "Uwazi",
    "detectionLogs.imagePath": "Njia ya Picha",
    "detectionLogs.retailPath": "Njia ya Rejareja",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const savedLanguage = localStorage.getItem("language") as Language;
        if (
          savedLanguage &&
          (savedLanguage === "en" || savedLanguage === "sw")
        ) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error("Failed to load language from localStorage:", error);
      }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    if (mounted) {
      try {
        localStorage.setItem("language", lang);
      } catch (error) {
        console.error("Failed to save language to localStorage:", error);
      }
    }
  };

  const t = (key: string): string => {
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
