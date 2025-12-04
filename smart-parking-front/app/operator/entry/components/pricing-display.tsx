"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PricingData } from "@/utils/api/types";
import {
  CreditCard,
  Shield,
  Zap,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Info,
  Receipt,
  Car,
  Truck,
  Bike,
} from "lucide-react";

interface PricingDisplayProps {
  pricing: PricingData;
  vehicle: any;
  gateAction: 'allow' | 'require_payment' | 'deny';
  onProcessPayment?: () => void;
  onAllowPassage?: () => void;
  isLoading?: boolean;
}

export function PricingDisplay({
  pricing,
  vehicle,
  gateAction,
  onProcessPayment,
  onAllowPassage,
  isLoading = false,
}: PricingDisplayProps) {
  const getPaymentTypeIcon = (paymentType: string) => {
    switch (paymentType) {
      case 'Cash':
        return <CreditCard className="w-5 h-5" />;
      case 'Bundle':
        return <Shield className="w-5 h-5" />;
      case 'Exemption':
        return <Zap className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType) {
      case 'Cash':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Bundle':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Exemption':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getVehicleIcon = (bodyType?: string) => {
    if (!bodyType) return <Car className="w-4 h-4" />;
    
    const type = bodyType.toLowerCase();
    if (type.includes('motorcycle') || type.includes('bike')) {
      return <Bike className="w-4 h-4" />;
    } else if (type.includes('truck') || type.includes('bus')) {
      return <Truck className="w-4 h-4" />;
    } else {
      return <Car className="w-4 h-4" />;
    }
  };

  const getGateActionIcon = (action: string) => {
    switch (action) {
      case 'allow':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'require_payment':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'deny':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getGateActionText = (action: string) => {
    switch (action) {
      case 'allow':
        return 'Gate will open automatically';
      case 'require_payment':
        return 'Payment required before gate opens';
      case 'deny':
        return 'Access denied';
      default:
        return 'Processing...';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Vehicle Information */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            {getVehicleIcon(vehicle?.body_type?.name)}
            <span>Vehicle Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Plate:</span>
                <span className="font-bold text-lg">{vehicle?.plate_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Type:</span>
                <span className="font-semibold">{vehicle?.body_type?.name || 'Unknown'}</span>
              </div>
            </div>
            <div className="space-y-2">
              {vehicle?.make && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted-foreground">Make:</span>
                  <span>{vehicle.make}</span>
                </div>
              )}
              {vehicle?.model && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-muted-foreground">Model:</span>
                  <span>{vehicle.model}</span>
                </div>
              )}
            </div>
            {vehicle?.owner_name && (
              <div className="col-span-2 flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Owner:</span>
                <span className="font-semibold">{vehicle.owner_name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            {getPaymentTypeIcon(pricing.payment_type)}
            <span>Pricing Information</span>
            <Badge className={getPaymentTypeColor(pricing.payment_type)}>
              {pricing.payment_type}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Payment Type Description */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {pricing.description}
              </p>
            </div>

            {/* Pricing Breakdown */}
            {pricing.payment_type === 'Cash' && pricing.requires_payment && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Base Amount:</span>
                  <span className="font-medium">Tsh. {pricing.base_amount}</span>
                </div>
                {pricing.discount_amount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">Discount:</span>
                    <span className="font-medium">-Tsh. {pricing.discount_amount}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold text-primary">
                    Tsh. {pricing.total_amount}
                  </span>
                </div>
              </div>
            )}

            {/* Bundle Information */}
            {pricing.payment_type === 'Bundle' && pricing.bundle_subscription_id && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Bundle Subscription Active</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                  Subscription ID: {pricing.bundle_subscription_id}
                </p>
              </div>
            )}

            {/* Exemption Information */}
            {pricing.payment_type === 'Exemption' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">Vehicle Exempted</span>
                </div>
                <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                  {pricing.description}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gate Action */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            {getGateActionIcon(gateAction)}
            <span>Gate Action</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {getGateActionText(gateAction)}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {gateAction === 'require_payment' && pricing.payment_type === 'Cash' && (
                <Button
                  onClick={onProcessPayment}
                  disabled={isLoading}
                  className="flex-1 gradient-maroon hover:opacity-90"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Process Payment
                </Button>
              )}

              {gateAction === 'allow' && (
                <Button
                  onClick={onAllowPassage}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Allow Passage
                </Button>
              )}

              {gateAction === 'deny' && (
                <Button
                  variant="destructive"
                  disabled={isLoading}
                  className="flex-1"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Access Denied
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
