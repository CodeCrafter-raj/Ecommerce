"use client";

import { useState, useEffect } from 'react';

const LOCATION_STORAGE_KEY = 'user_location';
const LOCATION_EXPIRY_DAYS = 20;

// Safe getter for browser-only localStorage access
const getStoredLocation = () => {
  if (typeof window === "undefined") return null; // ⛔ Prevent SSR crash

  const storedData = localStorage.getItem(LOCATION_STORAGE_KEY);
  if (!storedData) return null;

  try {
    const parsedData = JSON.parse(storedData);
    const expiryTime = LOCATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const isExpired = Date.now() - parsedData.timeStamp > expiryTime;

    return isExpired ? null : parsedData;
  } catch (error) {
    console.error("Error parsing stored location:", error);
    return null;
  }
};

const useLocationTracking = () => {
  const [location, setLocation] = useState<{
    country: string;
    city: string;
    timeStamp: number;
  } | null>(null);

  useEffect(() => {
    // Load storage AFTER mount (safe)
    const stored = getStoredLocation();
    if (stored) {
      setLocation(stored);
      return;
    }

    // Otherwise fetch new data
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        const newLocation = {
          country: data.country_name,
          city: data.city,
          timeStamp: Date.now(),
        };

        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
        setLocation(newLocation);
      })
      .catch((err) => console.error("Error fetching location:", err));
  }, []);

  return location;
};

export default useLocationTracking;
