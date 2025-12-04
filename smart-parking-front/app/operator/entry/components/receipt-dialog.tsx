"use client";

import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Car, Receipt, Download } from "lucide-react";
import { generateReceiptHTML, printContent } from "@/utils/print-utils";
import { toast } from "sonner";

interface ReceiptData {
  plateNumber: string;
  vehicleType: string;
  entryTime: string;
  rate: number;
  receiptId: string;
  vehicleDetails?: any;
  gate?: string;
  passageNumber?: string;
  passageType?: string;
  paymentMethod?: string;
  amount?: number;
}

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: ReceiptData | null;
}

export function ReceiptDialog({
  open,
  onOpenChange,
  receiptData,
}: ReceiptDialogProps) {
  if (!receiptData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-gradient">
            Parking Receipt
          </DialogTitle>
          <DialogDescription className="text-center">
            Vehicle successfully registered
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-dashed border-primary">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto gradient-maroon rounded-full flex items-center justify-center mb-2">
                <Car className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg">Smart Parking System</h3>
              <p className="text-sm text-muted-foreground">Entry Receipt</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Receipt ID:</span>
                <span className="font-mono">{receiptData.receiptId}</span>
              </div>
              {receiptData.passageNumber && (
                <div className="flex justify-between">
                  <span>Passage Number:</span>
                  <span className="font-mono">{receiptData.passageNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>License Plate:</span>
                <span className="font-bold">{receiptData.plateNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Vehicle Type:</span>
                <span className="capitalize">{receiptData.vehicleType}</span>
              </div>
              <div className="flex justify-between">
                <span>Entry Time:</span>
                <span>{receiptData.entryTime}</span>
              </div>
              {receiptData.gate && (
                <div className="flex justify-between">
                  <span>Gate:</span>
                  <span className="font-medium">{receiptData.gate}</span>
                </div>
              )}
              {receiptData.passageType && (
                <div className="flex justify-between">
                  <span>Passage Type:</span>
                  <span
                    className={`capitalize font-medium ${
                      receiptData.passageType === "free"
                        ? "text-green-600"
                        : receiptData.passageType === "exempted"
                        ? "text-yellow-600"
                        : "text-blue-600"
                    }`}
                  >
                    {receiptData.passageType}
                  </span>
                </div>
              )}
              {receiptData.paymentMethod && (
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="capitalize">
                    {receiptData.paymentMethod}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Amount:</span>
                <span
                  className={`${
                    receiptData.passageType === "free" ||
                    receiptData.passageType === "exempted"
                      ? "text-green-600"
                      : ""
                  }`}
                >
                  {receiptData.passageType === "free" ||
                  receiptData.passageType === "exempted"
                    ? "FREE"
                    : `Tsh. ${receiptData.amount || receiptData.rate}.00`}
                </span>
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              <p>Please keep this receipt for exit</p>
              <p>Lost receipts subject to maximum daily rate</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={async () => {
                try {
                  const htmlContent = generateReceiptHTML(receiptData);
                  await printContent({
                    title: "Parking Receipt",
                    content: htmlContent,
                  });
                  toast.success(
                    "Receipt downloaded! Open the HTML file and press Ctrl+P to print."
                  );
                } catch (error) {
                  console.error("Print error:", error);
                  toast.error("Failed to download receipt. Please try again.");
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
            <Button
              className="flex-1 gradient-maroon hover:opacity-90"
              onClick={() => onOpenChange(false)}
            >
              Continue
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
