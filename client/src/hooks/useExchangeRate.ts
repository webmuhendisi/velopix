import { useState, useEffect } from "react";

interface ExchangeRateData {
  usdToTry: number;
  currency: string;
  lastUpdated: string;
}

export function useExchangeRate() {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchRate = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/exchange-rate");
        if (!response.ok) {
          throw new Error("Failed to fetch exchange rate");
        }
        const data: ExchangeRateData = await response.json();
        if (mounted) {
          setRate(data.usdToTry);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
          // Fallback rate if API fails
          setRate(42.95);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchRate();

    // Refresh rate every 1 hour
    const interval = setInterval(fetchRate, 3600000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const usdToTry = (usdPrice: number | string): number => {
    const price = typeof usdPrice === "string" ? parseFloat(usdPrice) : usdPrice;
    if (!rate) return price * 42.95; // Fallback
    return price * rate;
  };

  const formatPrice = (usdPrice: number | string, showBoth: boolean = false): string => {
    const price = typeof usdPrice === "string" ? parseFloat(usdPrice) : usdPrice;
    const tryPrice = usdToTry(price);
    
    if (showBoth) {
      return `$${price.toFixed(2)} (${tryPrice.toFixed(2)} ₺)`;
    }
    return `$${price.toFixed(2)}`;
  };

  return {
    rate,
    loading,
    error,
    usdToTry,
    formatPrice,
  };
}

