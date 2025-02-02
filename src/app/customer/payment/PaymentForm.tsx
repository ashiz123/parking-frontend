"use client";
import React, { useEffect, useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  CardElement,
} from "@stripe/react-stripe-js";
import { fetchExitVehicleFromParking } from "./fetchExitVehicleFromParking";
import { useVehicleContext } from "../VehicleContext/UseVehicleContext";
import { useRouter } from "next/navigation";

interface PaymentFormProps {
  clientSecret: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const { vehicleData } = useVehicleContext();
  const router = useRouter();

  useEffect(() => {
    if (paymentStatus === "payment succeeded") {
      const timer = setTimeout(() => {
        console.log("message after 10 secs");
        router.push("/customer");
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [paymentStatus, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements) {
      console.error("Stripe or Elements not loaded yet");
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      console.error("CardElement not found.");
      return;
    }

    try {
      setIsProcessing(true);
      const { paymentIntent, error } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: "Jenny Rosen", // Customer's full name
              email: "jenny.rosen@example.com", // Customer's email
              phone: "555-555-5555", // Customer's phone number (optional)
              address: {
                line1: "123 Main Street", // Address line 1
                line2: "Apt 4B", // Address line 2 (optional)
                city: "San Francisco", // City
                state: "CA", // State or province
                postal_code: "94111", // Postal/ZIP code
                country: "US", // 2-letter country code (ISO 3166-1 alpha-2)
              },
            },
          },
        }
      );

      console.log("intent", paymentIntent);
      console.log("error", error);

      if (error) {
        console.error("[Payment error]", error.message);
        setPaymentStatus("Payment failed. Please try again.");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        fetchExitVehicleFromParking(vehicleData.vehicle_reg);
        setPaymentStatus("Payment succeeded! 🎉");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Unhandled Error:", error.message);
        setPaymentStatus("An unexpected error occurred.");
      } else {
        console.error("Unexpected Error:", error);
        setPaymentStatus("An unexpected error occurred.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStatus === "payment succeeded") {
    setTimeout(() => {
      router.push("/customer");
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {isProcessing && <p>Payment is processing</p>}
      {paymentStatus && <p>{paymentStatus}</p>}
      <CardElement />

      <button
        className="bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg w-full hover:bg-blue-600 transition mt-5"
        type="submit"
        disabled={isProcessing}
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
};

export default PaymentForm;
