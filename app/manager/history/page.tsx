"use client";

import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import {
  Search,
  Filter,
  Download,
  Calendar,
  Car,
  Truck,
  Bike,
  DollarSign,
  Clock,
  TrendingUp,
  FileText,
  Eye,
  RefreshCw,
} from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays, format, subDays } from "date-fns";

// Mock data for parking history
const mockParkingHistory = [
  {
    id: "1",
    plateNumber: "ABC-123",
    vehicleType: "car",
    entryTime: "2024-01-20 08:30:00",
    exitTime: "2024-01-20 12:45:00",
    duration: "4h 15m",
    spot: "A-15",
    operator: "John Doe",
    rate: "Tsh. 5.00",
    totalAmount: "Tsh. 21.25",
    status: "completed",
    receiptId: "RCP-20240120-001",
  },
  {
    id: "2",
    plateNumber: "ABC-123",
    vehicleType: "car",
    entryTime: "2024-01-19 14:20:00",
    exitTime: "2024-01-19 18:45:00",
    duration: "4h 25m",
    spot: "A-12",
    operator: "Jane Smith",
    rate: "Tsh. 5.00",
    totalAmount: "Tsh. 22.08",
    status: "completed",
    receiptId: "RCP-20240119-003",
  },
  {
    id: "3",
    plateNumber: "ABC-123",
    vehicleType: "car",
    entryTime: "2024-01-18 09:15:00",
    exitTime: "2024-01-18 11:30:00",
    duration: "2h 15m",
    spot: "B-08",
    operator: "Mike Johnson",
    rate: "Tsh. 5.00",
    totalAmount: "Tsh. 11.25",
    status: "completed",
    receiptId: "RCP-20240118-002",
  },
  {
    id: "4",
    plateNumber: "XYZ-789",
    vehicleType: "motorcycle",
    entryTime: "2024-01-20 09:15:00",
    exitTime: "2024-01-20 10:45:00",
    duration: "1h 30m",
    spot: "B-08",
    operator: "Jane Smith",
    rate: "Tsh. 3.00",
    totalAmount: "Tsh. 4.50",
    status: "completed",
    receiptId: "RCP-20240120-002",
  },
  {
    id: "5",
    plateNumber: "XYZ-789",
    vehicleType: "motorcycle",
    entryTime: "2024-01-19 16:00:00",
    exitTime: "2024-01-19 17:30:00",
    duration: "1h 30m",
    spot: "A-05",
    operator: "John Doe",
    rate: "Tsh. 3.00",
    totalAmount: "Tsh. 4.50",
    status: "completed",
    receiptId: "RCP-20240119-004",
  },
  {
    id: "6",
    plateNumber: "DEF-456",
    vehicleType: "truck",
    entryTime: "2024-01-20 07:45:00",
    exitTime: "2024-01-20 15:30:00",
    duration: "7h 45m",
    spot: "C-03",
    operator: "Mike Johnson",
    rate: "Tsh. 8.00",
    totalAmount: "Tsh. 62.00",
    status: "completed",
    receiptId: "RCP-20240120-003",
  },
  {
    id: "7",
    plateNumber: "GHI-789",
    vehicleType: "car",
    entryTime: "2024-01-20 14:00:00",
    exitTime: "2024-01-20 18:30:00",
    duration: "4h 30m",
    spot: "A-22",
    operator: "Sarah Wilson",
    rate: "Tsh. 5.00",
    totalAmount: "Tsh. 22.50",
    status: "completed",
    receiptId: "RCP-20240120-004",
  },
  {
    id: "8",
    plateNumber: "JKL-012",
    vehicleType: "car",
    entryTime: "2024-01-20 10:30:00",
    exitTime: "2024-01-20 12:15:00",
    duration: "1h 45m",
    spot: "B-14",
    operator: "John Doe",
    rate: "Tsh. 5.00",
    totalAmount: "Tsh. 8.75",
    status: "completed",
    receiptId: "RCP-20240120-005",
  },
  {
    id: "9",
    plateNumber: "MNO-345",
    vehicleType: "motorcycle",
    entryTime: "2024-01-20 08:00:00",
    exitTime: "2024-01-20 10:45:00",
    duration: "2h 45m",
    spot: "A-05",
    operator: "Jane Smith",
    rate: "Tsh. 3.00",
    totalAmount: "Tsh. 8.25",
    status: "completed",
    receiptId: "RCP-20240120-006",
  },
  {
    id: "10",
    plateNumber: "PQR-678",
    vehicleType: "truck",
    entryTime: "2024-01-19 06:00:00",
    exitTime: "2024-01-19 20:00:00",
    duration: "14h 00m",
    spot: "C-07",
    operator: "Mike Johnson",
    rate: "Tsh. 8.00",
    totalAmount: "Tsh. 112.00",
    status: "completed",
    receiptId: "RCP-20240119-001",
  },
  {
    id: "11",
    plateNumber: "STU-901",
    vehicleType: "car",
    entryTime: "2024-01-20 12:00:00",
    exitTime: "2024-01-20 16:30:00",
    duration: "4h 30m",
    spot: "A-18",
    operator: "Sarah Wilson",
    rate: "Tsh. 5.00",
    totalAmount: "Tsh. 22.50",
    status: "completed",
    receiptId: "RCP-20240120-007",
  },
  {
    id: "12",
    plateNumber: "VWX-234",
    vehicleType: "motorcycle",
    entryTime: "2024-01-20 15:30:00",
    exitTime: "2024-01-20 17:45:00",
    duration: "2h 15m",
    spot: "B-12",
    operator: "John Doe",
    rate: "Tsh. 3.00",
    totalAmount: "Tsh. 6.75",
    status: "completed",
    receiptId: "RCP-20240120-008",
  },
  {
    id: "13",
    plateNumber: "YZA-567",
    vehicleType: "car",
    entryTime: "2024-01-20 09:00:00",
    exitTime: "2024-01-20 11:30:00",
    duration: "2h 30m",
    spot: "A-09",
    operator: "Jane Smith",
    rate: "Tsh. 5.00",
    totalAmount: "Tsh. 12.50",
    status: "completed",
    receiptId: "RCP-20240120-009",
  },
  {
    id: "14",
    plateNumber: "BCD-234",
    vehicleType: "car",
    entryTime: "2024-01-19 11:00:00",
    exitTime: "2024-01-19 15:20:00",
    duration: "4h 20m",
    spot: "B-16",
    operator: "Mike Johnson",
    rate: "Tsh. 5.00",
    totalAmount: "Tsh. 21.67",
    status: "completed",
    receiptId: "RCP-20240119-002",
  },
  {
    id: "15",
    plateNumber: "EFG-567",
    vehicleType: "truck",
    entryTime: "2024-01-18 08:30:00",
    exitTime: "2024-01-18 19:45:00",
    duration: "11h 15m",
    spot: "C-12",
    operator: "Sarah Wilson",
    rate: "Tsh. 8.00",
    totalAmount: "Tsh. 90.00",
    status: "completed",
    receiptId: "RCP-20240118-001",
  },
  {
    id: "16",
    plateNumber: "HIJ-890",
    vehicleType: "motorcycle",
    entryTime: "2024-01-17 13:45:00",
    exitTime: "2024-01-17 16:15:00",
    duration: "2h 30m",
    spot: "A-03",
    operator: "John Doe",
    rate: "Tsh. 3.00",
    totalAmount: "Tsh. 7.50",
    status: "completed",
    receiptId: "RCP-20240117-001",
  },
  {
    id: "17",
    plateNumber: "KLM-123",
    vehicleType: "car",
    entryTime: "2024-01-16 10:15:00",
    exitTime: "2024-01-16 14:30:00",
    duration: "4h 15m",
    spot: "A-25",
    operator: "Jane Smith",
    rate: "Tsh. 5.00",
    totalAmount: "Tsh. 21.25",
    status: "completed",
    receiptId: "RCP-20240116-001",
  },
  {
    id: "18",
    plateNumber: "NOP-456",
    vehicleType: "truck",
    entryTime: "2024-01-15 07:00:00",
    exitTime: "2024-01-15 22:00:00",
    duration: "15h 00m",
    spot: "C-05",
    operator: "Mike Johnson",
    rate: "Tsh. 8.00",
    totalAmount: "Tsh. 120.00",
    status: "completed",
    receiptId: "RCP-20240115-001",
  },
  {
    id: "19",
    plateNumber: "QRS-789",
    vehicleType: "motorcycle",
    entryTime: "2024-01-14 09:30:00",
    exitTime: "2024-01-14 11:45:00",
    duration: "2h 15m",
    spot: "B-09",
    operator: "Sarah Wilson",
    rate: "Tsh. 3.00",
    totalAmount: "Tsh. 6.75",
    status: "completed",
    receiptId: "RCP-20240114-001",
  },
  {
    id: "20",
    plateNumber: "TUV-012",
    vehicleType: "car",
    entryTime: "2024-01-13 16:00:00",
    exitTime: "2024-01-13 20:15:00",
    duration: "4h 15m",
    spot: "A-28",
    operator: "John Doe",
    rate: "Tsh. 5.00",
    totalAmount: "Tsh. 21.25",
    status: "completed",
    receiptId: "RCP-20240113-001",
  },
];

export default function ParkingHistory() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("all");
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date("2024-01-13"), // Start from January 13th to include all our dummy data
    to: new Date("2024-01-20"), // End on January 20th to include all our dummy data
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [showVehicleReceipts, setShowVehicleReceipts] = useState(false);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return mockParkingHistory.filter((record) => {
      const matchesSearch =
        record.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.spot.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.operator.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesVehicleType =
        vehicleTypeFilter === "all" || record.vehicleType === vehicleTypeFilter;

      const matchesOperator =
        operatorFilter === "all" || record.operator === operatorFilter;

      const matchesStatus =
        statusFilter === "all" || record.status === statusFilter;

      const recordDate = new Date(record.entryTime);
      const matchesDateRange =
        recordDate >= dateRange.from && recordDate <= dateRange.to;

      return (
        matchesSearch &&
        matchesVehicleType &&
        matchesOperator &&
        matchesStatus &&
        matchesDateRange
      );
    });
  }, [searchTerm, vehicleTypeFilter, operatorFilter, statusFilter, dateRange]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalRevenue = filteredData.reduce(
      (sum, record) =>
        sum + parseFloat(record.totalAmount.replace("Tsh. ", "")),
      0
    );

    const totalVehicles = filteredData.length;
    const avgDuration =
      filteredData.reduce((sum, record) => {
        const duration = record.duration;
        const hours = parseInt(duration.split("h")[0]);
        const minutes = parseInt(
          duration.split(" ")[1]?.replace("m", "") || "0"
        );
        return sum + hours + minutes / 60;
      }, 0) / totalVehicles;

    const vehicleTypeBreakdown = filteredData.reduce((acc, record) => {
      acc[record.vehicleType] = (acc[record.vehicleType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalVehicles,
      avgDuration: avgDuration.toFixed(1),
      vehicleTypeBreakdown,
    };
  }, [filteredData]);

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "car":
        return Car;
      case "motorcycle":
        return Bike;
      case "truck":
        return Truck;
      default:
        return Car;
    }
  };

  const getVehicleColor = (type: string) => {
    switch (type) {
      case "car":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "motorcycle":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "truck":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Plate Number",
      "Vehicle Type",
      "Entry Time",
      "Exit Time",
      "Duration",
      "Spot",
      "Operator",
      "Rate",
      "Total Amount",
      "Status",
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      filteredData
        .map((record) =>
          [
            record.id,
            record.plateNumber,
            record.vehicleType,
            record.entryTime,
            record.exitTime,
            record.duration,
            record.spot,
            record.operator,
            record.rate,
            record.totalAmount,
            record.status,
          ].join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `parking_history_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const operators = Array.from(
    new Set(mockParkingHistory.map((record) => record.operator))
  );

  // Handle date range changes
  const handleDateRangeChange = (date: any) => {
    if (date?.from && date?.to) {
      setDateRange({ from: date.from, to: date.to });
    }
  };

  // Get vehicle receipts
  const getVehicleReceipts = (plateNumber: string) => {
    return mockParkingHistory.filter(
      (record) => record.plateNumber === plateNumber
    );
  };

  // Download individual receipt
  const downloadIndividualReceipt = (record: any) => {
    const receiptContent = `
PARKING RECEIPT
================

Receipt ID: ${record.receiptId}
Date: ${format(new Date(record.entryTime), "PPP")}
Time: ${format(new Date(record.entryTime), "HH:mm")} - ${format(
      new Date(record.exitTime),
      "HH:mm"
    )}

VEHICLE INFORMATION
------------------
Plate Number: ${record.plateNumber}
Vehicle Type: ${record.vehicleType}
Parking Spot: ${record.spot}

PARKING DETAILS
---------------
Entry Time: ${format(new Date(record.entryTime), "PPP 'at' HH:mm")}
Exit Time: ${format(new Date(record.exitTime), "PPP 'at' HH:mm")}
Duration: ${record.duration}

FINANCIAL INFORMATION
--------------------
Hourly Rate: ${record.rate}
Total Amount: ${record.totalAmount}

SERVICE INFORMATION
------------------
Operator: ${record.operator}
Status: ${record.status}

Thank you for using our parking service!
    `.trim();

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt_${record.receiptId}_${format(
      new Date(record.entryTime),
      "yyyy-MM-dd"
    )}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download PDF report
  const downloadPDFReport = () => {
    const reportContent = `
PARKING HISTORY REPORT
======================

Generated: ${format(new Date(), "PPP 'at' HH:mm")}
Period: ${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}

SUMMARY STATISTICS
------------------
Total Records: ${filteredData.length}
Total Revenue: Tsh. ${analytics.totalRevenue}
Average Duration: ${analytics.avgDuration} hours
Vehicle Types: ${Object.keys(analytics.vehicleTypeBreakdown).length}

VEHICLE TYPE BREAKDOWN
---------------------
${Object.entries(analytics.vehicleTypeBreakdown)
  .map(([type, count]) => `${type}: ${count} vehicles`)
  .join("\n")}

DETAILED RECORDS
----------------
${filteredData
  .map(
    (record, index) => `
${index + 1}. ${record.plateNumber} (${record.vehicleType})
   Date: ${format(new Date(record.entryTime), "PPP")}
   Time: ${format(new Date(record.entryTime), "HH:mm")} - ${format(
      new Date(record.exitTime),
      "HH:mm"
    )}
   Duration: ${record.duration}
   Amount: ${record.totalAmount}
   Operator: ${record.operator}
   Receipt ID: ${record.receiptId}
`
  )
  .join("\n")}

OPERATOR PERFORMANCE
-------------------
${operators
  .map((operator) => {
    const operatorRecords = filteredData.filter(
      (record) => record.operator === operator
    );
    const operatorRevenue = operatorRecords.reduce(
      (sum, record) =>
        sum + parseFloat(record.totalAmount.replace("Tsh. ", "")),
      0
    );
    return `${operator}: ${
      operatorRecords.length
    } records, Tsh. ${operatorRevenue.toFixed(2)} revenue`;
  })
  .join("\n")}

Report generated by Smart Parking System
    `.trim();

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `parking_history_report_${format(
      new Date(),
      "yyyy-MM-dd_HH-mm"
    )}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gradient">Parking Report</h1>
            <p className="text-muted-foreground mt-2">
              Complete parking records and analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="glass-effect border-0 bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={downloadPDFReport}
              variant="outline"
              className="glass-effect border-0 bg-transparent"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download PDF Report
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="glass-effect border-0 bg-transparent"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </motion.div>

        {/* Analytics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold">
                    Tsh. {analytics.totalRevenue}
                  </p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Vehicles
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.totalVehicles}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Car className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Duration
                  </p>
                  <p className="text-2xl font-bold">{analytics.avgDuration}h</p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Vehicle Types
                  </p>
                  <p className="text-2xl font-bold">
                    {Object.keys(analytics.vehicleTypeBreakdown).length}
                  </p>
                </div>
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-effect border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="space-y-2">
                      <DatePickerWithRange
                        date={dateRange}
                        setDate={handleDateRangeChange}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateRange({
                            from: new Date("2024-01-01"),
                            to: new Date("2024-12-31"),
                          });
                        }}
                        className="w-full text-xs"
                      >
                        Show All Data
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Vehicle Type</Label>
                    <Select
                      value={vehicleTypeFilter}
                      onValueChange={setVehicleTypeFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <Select
                      value={operatorFilter}
                      onValueChange={setOperatorFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All operators" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Operators</SelectItem>
                        {operators.map((operator) => (
                          <SelectItem key={operator} value={operator}>
                            {operator}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setVehicleTypeFilter("all");
                        setOperatorFilter("all");
                        setStatusFilter("all");
                        setDateRange({
                          from: new Date("2024-01-13"),
                          to: new Date("2024-01-20"),
                        });
                      }}
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by plate number, spot, or operator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Parking Records</CardTitle>
              <CardDescription>
                Showing {filteredData.length} of {mockParkingHistory.length}{" "}
                records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Entry Time</TableHead>
                      <TableHead>Exit Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Spot</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? (
                      filteredData.map((record) => {
                        const VehicleIcon = getVehicleIcon(record.vehicleType);
                        return (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="p-1 bg-primary/10 rounded-full">
                                  <VehicleIcon className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {record.plateNumber}
                                  </p>
                                  <Badge
                                    className={getVehicleColor(
                                      record.vehicleType
                                    )}
                                  >
                                    {record.vehicleType}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(
                                new Date(record.entryTime),
                                "MMM dd, yyyy HH:mm"
                              )}
                            </TableCell>
                            <TableCell>
                              {format(
                                new Date(record.exitTime),
                                "MMM dd, yyyy HH:mm"
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-mono">
                                {record.duration}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{record.spot}</Badge>
                            </TableCell>
                            <TableCell>{record.operator}</TableCell>
                            <TableCell>
                              <span className="font-bold text-green-600">
                                {record.totalAmount}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  record.status === "completed"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                                }
                              >
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setShowDetails(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedVehicle(record.plateNumber);
                                    setShowVehicleReceipts(true);
                                  }}
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Search className="w-8 h-8 text-muted-foreground" />
                            <p className="text-muted-foreground font-medium">
                              No parking records found
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Try adjusting your filters or search terms
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchTerm("");
                                setVehicleTypeFilter("all");
                                setOperatorFilter("all");
                                setStatusFilter("all");
                                setDateRange({
                                  from: new Date("2024-01-13"),
                                  to: new Date("2024-01-20"),
                                });
                              }}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reset Filters
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-white dark:bg-gray-900 border-0 shadow-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Parking Record Details</DialogTitle>
            <DialogDescription>
              Complete information for this parking session
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Vehicle Information
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Plate Number:</span>
                        <span className="font-bold">
                          {selectedRecord.plateNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vehicle Type:</span>
                        <Badge
                          className={getVehicleColor(
                            selectedRecord.vehicleType
                          )}
                        >
                          {selectedRecord.vehicleType}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Parking Spot:</span>
                        <span className="font-mono">{selectedRecord.spot}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Timing Information
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Entry Time:</span>
                        <span>
                          {format(
                            new Date(selectedRecord.entryTime),
                            "PPP 'at' HH:mm"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Exit Time:</span>
                        <span>
                          {format(
                            new Date(selectedRecord.exitTime),
                            "PPP 'at' HH:mm"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-mono">
                          {selectedRecord.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Financial Information
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Hourly Rate:</span>
                        <span>{selectedRecord.rate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-bold text-lg text-green-600">
                          {selectedRecord.totalAmount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Service Information
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span>Operator:</span>
                        <span>{selectedRecord.operator}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge
                          className={
                            selectedRecord.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                          }
                        >
                          {selectedRecord.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Record ID:</span>
                        <span className="font-mono text-sm">
                          {selectedRecord.id}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    if (selectedRecord) {
                      downloadIndividualReceipt(selectedRecord);
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
                <Button
                  className="flex-1 gradient-maroon hover:opacity-90"
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vehicle Receipts Modal */}
      <Dialog open={showVehicleReceipts} onOpenChange={setShowVehicleReceipts}>
        <DialogContent className="bg-white dark:bg-gray-900 border-0 shadow-2xl max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vehicle Receipts - {selectedVehicle}</DialogTitle>
            <DialogDescription>
              Complete payment history for this vehicle
            </DialogDescription>
          </DialogHeader>

          {selectedVehicle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Vehicle Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Visits
                    </p>
                    <p className="text-2xl font-bold">
                      {getVehicleReceipts(selectedVehicle).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-green-600">
                      Tsh.{" "}
                      {getVehicleReceipts(selectedVehicle)
                        .reduce(
                          (sum, record) =>
                            sum +
                            parseFloat(record.totalAmount.replace("Tsh. ", "")),
                          0
                        )
                        .toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Avg Duration
                    </p>
                    <p className="text-2xl font-bold">
                      {getVehicleReceipts(selectedVehicle).length > 0
                        ? (
                            getVehicleReceipts(selectedVehicle).reduce(
                              (sum, record) => {
                                const duration = record.duration;
                                const hours = parseInt(duration.split("h")[0]);
                                const minutes = parseInt(
                                  duration.split(" ")[1]?.replace("m", "") ||
                                    "0"
                                );
                                return sum + hours + minutes / 60;
                              },
                              0
                            ) / getVehicleReceipts(selectedVehicle).length
                          ).toFixed(1)
                        : "0"}
                      h
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Visit</p>
                    <p className="text-lg font-medium">
                      {getVehicleReceipts(selectedVehicle).length > 0
                        ? format(
                            new Date(
                              getVehicleReceipts(selectedVehicle)[0].entryTime
                            ),
                            "MMM dd, yyyy"
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Receipts List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment History</h3>
                <div className="space-y-3">
                  {getVehicleReceipts(selectedVehicle)
                    .sort(
                      (a, b) =>
                        new Date(b.entryTime).getTime() -
                        new Date(a.entryTime).getTime()
                    )
                    .map((receipt) => (
                      <motion.div
                        key={receipt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-primary/10 rounded-full">
                              {getVehicleIcon(receipt.vehicleType)({
                                className: "w-5 h-5 text-primary",
                              })}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">
                                  {receipt.receiptId}
                                </p>
                                <Badge
                                  className={getVehicleColor(
                                    receipt.vehicleType
                                  )}
                                >
                                  {receipt.vehicleType}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format(
                                  new Date(receipt.entryTime),
                                  "PPP 'at' HH:mm"
                                )}{" "}
                                - {format(new Date(receipt.exitTime), "HH:mm")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Spot: {receipt.spot} • Duration:{" "}
                                {receipt.duration} • Operator:{" "}
                                {receipt.operator}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex flex-col items-end space-y-2">
                              <div>
                                <p className="text-lg font-bold text-green-600">
                                  {receipt.totalAmount}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Rate: {receipt.rate}
                                </p>
                                <Badge
                                  className={
                                    receipt.status === "completed"
                                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                                  }
                                >
                                  {receipt.status}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  downloadIndividualReceipt(receipt)
                                }
                                className="text-xs"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    // Export vehicle receipts
                    const vehicleReceipts = getVehicleReceipts(selectedVehicle);
                    const headers = [
                      "Receipt ID",
                      "Date",
                      "Entry Time",
                      "Exit Time",
                      "Duration",
                      "Spot",
                      "Operator",
                      "Rate",
                      "Total Amount",
                      "Status",
                    ];

                    const csvContent =
                      "data:text/csv;charset=utf-8," +
                      headers.join(",") +
                      "\n" +
                      vehicleReceipts
                        .map((receipt) =>
                          [
                            receipt.receiptId,
                            format(new Date(receipt.entryTime), "yyyy-MM-dd"),
                            format(new Date(receipt.entryTime), "HH:mm"),
                            format(new Date(receipt.exitTime), "HH:mm"),
                            receipt.duration,
                            receipt.spot,
                            receipt.operator,
                            receipt.rate,
                            receipt.totalAmount,
                            receipt.status,
                          ].join(",")
                        )
                        .join("\n");

                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute(
                      "download",
                      `vehicle_receipts_${selectedVehicle}_${format(
                        new Date(),
                        "yyyy-MM-dd"
                      )}.csv`
                    );
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Receipts
                </Button>
                <Button
                  className="flex-1 gradient-maroon hover:opacity-90"
                  onClick={() => setShowVehicleReceipts(false)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
