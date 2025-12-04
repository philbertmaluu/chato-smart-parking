"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VehiclePassageService } from "@/utils/api/vehicle-passage-service";
import { getAuthToken } from "@/utils/auth/auth";
import { toast } from "sonner";
import { Loader2, TestTube, AlertCircle } from "lucide-react";

export function TestVehiclePassage() {
  const [plateNumber, setPlateNumber] = useState("ABC-123");
  const [gateId, setGateId] = useState("1");
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [authToken] = useState(getAuthToken());

  const testVehicleEntry = async () => {
    setIsTesting(true);
    setResult(null);

    // Check authentication
    const authToken = getAuthToken();
    if (!authToken) {
      toast.error("Please log in first");
      setResult({ error: "Authentication required" });
      setIsTesting(false);
      return;
    }

    try {
      const testData = {
        plate_number: plateNumber,
        gate_id: parseInt(gateId),
        body_type_id: 1,
        make: "Toyota",
        model: "Camry",
        year: 2020,
        color: "White",
        owner_name: "John Doe",
        passage_type: "toll" as const,
        payment_method: "cash",
        payment_amount: 5.0,
        payment_type_id: 1,
        notes: "Test entry from frontend",
      };

      

      const response = await VehiclePassageService.processEntry(testData);

      console.log("Test response:", response);
      setResult(response);

      if (response.success) {
        toast.success("Test successful! Vehicle entry processed.");
      } else {
        toast.error(`Test failed: ${response.message}`);
      }
    } catch (error: any) {
      console.error("Test error:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
      });
      setResult({
        error: error.message,
        details: {
          status: error.response?.status,
          data: error.response?.data,
        },
      });
      toast.error(`Test error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testQuickLookup = async () => {
    setIsTesting(true);
    setResult(null);

    try {
      console.log("Testing quick lookup for plate:", plateNumber);

      const response = await VehiclePassageService.quickLookup(plateNumber);

      console.log("Quick lookup response:", response);
      setResult(response);

      if (response.success) {
        toast.success("Quick lookup successful!");
      } else {
        toast.error(`Quick lookup failed: ${response.message}`);
      }
    } catch (error: any) {
      console.error("Quick lookup error:", error);
      setResult({ error: error.message });
      toast.error(`Quick lookup error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="w-5 h-5" />
          <span>Test Vehicle Passage Service</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authentication Status */}
        <div
          className={`p-3 rounded-lg flex items-center space-x-2 ${
            authToken
              ? "bg-green-50 dark:bg-green-900/20"
              : "bg-red-50 dark:bg-red-900/20"
          }`}
        >
          {authToken ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Authenticated
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Not Authenticated
              </span>
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="plateNumber">Plate Number</Label>
          <Input
            id="plateNumber"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="ABC-123"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gateId">Gate ID</Label>
          <Input
            id="gateId"
            value={gateId}
            onChange={(e) => setGateId(e.target.value)}
            placeholder="1"
            type="number"
          />
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={testVehicleEntry}
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Entry"
            )}
          </Button>

          <Button
            onClick={testQuickLookup}
            disabled={isTesting}
            variant="outline"
            className="flex-1"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Quick Lookup"
            )}
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-2">Result:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
