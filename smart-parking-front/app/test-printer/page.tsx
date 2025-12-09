"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { printReceiptDirect, getAvailablePrinters } from "@/utils/printer/direct-printer";
import { PRINTER_CONFIG } from "@/utils/printer/printer-config";
import { Printer, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function TestPrinterPage() {
  const [printerName, setPrinterName] = useState(PRINTER_CONFIG.defaultPrinterName);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printResult, setPrintResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    setIsLoadingPrinters(true);
    try {
      const printers = await getAvailablePrinters();
      setAvailablePrinters(printers);
      if (printers.length > 0) {
        // Try to find the default printer, otherwise use first available
        const defaultPrinter = printers.find(p => p === PRINTER_CONFIG.defaultPrinterName);
        setPrinterName(defaultPrinter || printers[0]);
      }
    } catch (error) {
      console.error("Failed to load printers:", error);
      toast.error("Failed to load printers list");
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  const handleTestPrint = async () => {
    setIsPrinting(true);
    setPrintResult(null);

    try {
      const receiptData = {
        company_name: "Smart Parking System",
        receipt_type: "TEST RECEIPT",
        receipt_id: `TEST-${Date.now()}`,
        plate_number: "TEST-123",
        amount: "Tsh 5,000.00",
        footer: "This is a test print from frontend",
      };

      await printReceiptDirect(receiptData, printerName);
      
      setPrintResult({
        success: true,
        message: "Receipt printed successfully! Check your printer.",
      });
      toast.success("Receipt printed successfully!");
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to print receipt";
      setPrintResult({
        success: false,
        message: errorMessage,
      });
      toast.error(errorMessage);
      console.error("Print error:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <MainLayout>
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Direct USB Printer Test
          </CardTitle>
          <CardDescription>
            Test printing directly from frontend to USB printer (no backend required)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="printer-name">Printer Name</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadPrinters}
                disabled={isLoadingPrinters}
                className="h-7"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingPrinters ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            {availablePrinters.length > 0 ? (
              <Select value={printerName} onValueChange={setPrinterName}>
                <SelectTrigger id="printer-name">
                  <SelectValue placeholder="Select a printer" />
                </SelectTrigger>
                <SelectContent>
                  {availablePrinters.map((printer) => (
                    <SelectItem key={printer} value={printer}>
                      {printer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="printer-name"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder="POS-80C or POS80C"
                disabled={isLoadingPrinters}
              />
            )}
            <p className="text-xs text-muted-foreground">
              {availablePrinters.length > 0
                ? `Found ${availablePrinters.length} printer(s). Select one from the list above.`
                : "Enter Windows printer name manually (e.g., 'POS-80C' or 'POS80C')"}
            </p>
          </div>

          <Button
            onClick={handleTestPrint}
            disabled={isPrinting || !printerName}
            className="w-full"
            size="lg"
          >
            {isPrinting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Printing...
              </>
            ) : (
              <>
                <Printer className="w-4 h-4 mr-2" />
                Print Test Receipt
              </>
            )}
          </Button>

          {printResult && (
            <Alert variant={printResult.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {printResult.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <AlertDescription>{printResult.message}</AlertDescription>
              </div>
            </Alert>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Test Receipt Data:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(
                {
                  company_name: "Smart Parking System",
                  receipt_type: "TEST RECEIPT",
                  receipt_id: "TEST-001",
                  plate_number: "TEST-123",
                  amount: "Tsh 5,000.00",
                  footer: "This is a test print from frontend",
                },
                null,
                2
              )}
            </pre>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold mb-2 text-sm">How It Works:</h3>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Uses Tauri command to call Rust function</li>
              <li>Rust uses Windows Print Spooler API</li>
              <li>Sends ESC/POS commands directly to printer</li>
              <li>No backend server required!</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
    </MainLayout>
  );
}

