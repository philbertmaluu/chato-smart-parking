"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { toast } from "sonner";
import {
  useOperators,
  type Operator,
} from "../hooks/use-operators";
import { useStations } from "@/app/manager/settings/hooks/use-stations";
import { MoreHorizontal, Plus, MapPin, X, Eye } from "lucide-react";
import { formatDate } from "@/utils/date-utils";

interface OperatorsTableProps {
  onViewDetails?: (operator: Operator) => void;
  onStatusChange?: (operator: Operator, isActive: boolean) => void;
}

export function OperatorsTable({ onViewDetails, onStatusChange }: OperatorsTableProps = {}) {
  const {
    operators,
    loading,
    error,
    pagination,
    fetchOperators,
    handlePageChange,
    assignStation,
    unassignStation,
    getOperatorStations,
    activateOperator,
    deactivateOperator,
  } = useOperators();

  const { stations, fetchStations } = useStations();

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<number>(0);
  const [operatorStations, setOperatorStations] = useState<Record<number, any[]>>({});

  useEffect(() => {
    fetchStations();
  }, []);

  // Fetch stations for each operator
  useEffect(() => {
    const fetchStationsForOperators = async () => {
      for (const operator of operators) {
        try {
          const stations = await getOperatorStations(operator.id);
          setOperatorStations(prev => ({ ...prev, [operator.id]: stations || [] }));
        } catch (error) {
          // Silently fail for individual operator stations
        }
      }
    };
    
    if (operators.length > 0) {
      fetchStationsForOperators();
    }
  }, [operators, getOperatorStations]);

  // Define table columns
  const columns: TableColumn<Operator>[] = useMemo(
    () => [
      {
        key: "id",
        title: "#",
        dataIndex: "id",
        searchable: false,
        render: (value) => <span className="font-medium">{value}</span>,
        width: "10px",
        align: "center",
      },
      {
        key: "username",
        title: "Operator",
        dataIndex: "username",
        searchable: true,
        render: (value, record) => (
          <div className="flex items-center space-x-2">
            <span className="text-xl">👤</span>
            <div>
              <div className="font-medium">{value}</div>
              <div className="text-sm text-muted-foreground">{record.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: "phone",
        title: "Phone",
        dataIndex: "phone",
        searchable: true,
        render: (value) => (
          <span className="text-sm">{value || "-"}</span>
        ),
      },
      {
        key: "assigned_stations",
        title: "Assigned Stations",
        dataIndex: "assigned_stations",
        searchable: false,
        render: (_, record) => {
          const stations = operatorStations[record.id] || [];
          return (
            <div className="flex flex-wrap gap-1">
              {stations.length > 0 ? (
                stations.map((station: any) => (
                  <Badge key={station.id} variant="secondary" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {station.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No stations assigned</span>
              )}
            </div>
          );
        },
      },
      {
        key: "is_active",
        title: "Status",
        dataIndex: "is_active",
        render: (value, record) => {
          // Normalize the active status to boolean
          const normalizeActive = (val: any): boolean => {
            if (val === true || val === 1) return true;
            if (typeof val === 'string' && (val === '1' || val.toLowerCase() === 'true')) return true;
            return false;
          };

          const getStatusLabel = (isActive: boolean) => {
            return isActive ? "Active" : "Inactive";
          };

          const getStatusColor = (isActive: boolean) => {
            return isActive ? "text-primary" : "text-gray-500";
          };

          const isActiveValue = normalizeActive(value) || normalizeActive(record.is_active);

          const handleStatusChange = async (checked: boolean) => {
            try {
              if (checked) {
                await activateOperator(record.id);
                toast.success("Operator activated successfully");
              } else {
                await deactivateOperator(record.id);
                toast.success("Operator deactivated successfully");
              }
              // Also call parent handler if provided
              if (onStatusChange) {
                onStatusChange(record, checked);
              }
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed to update operator status");
            }
          };

          return (
            <div className="flex flex-col items-start">
              <Switch
                checked={isActiveValue}
                onCheckedChange={handleStatusChange}
                disabled={loading}
              />
              <span className={`text-xs mt-1 ${getStatusColor(isActiveValue)}`}>
                {getStatusLabel(isActiveValue)}
              </span>
            </div>
          );
        },
      },
      {
        key: "created_at",
        title: "Created",
        dataIndex: "created_at",
        render: (value) => formatDate(value),
      },
      {
        key: "actions",
        title: "Actions",
        align: "right",
        render: (_, record) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewDetails && (
                  <DropdownMenuItem onClick={() => onViewDetails(record)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => openAssignDialog(record)}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Assign Station
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [operatorStations]
  );

  const openAssignDialog = (operator: Operator) => {
    setSelectedOperator(operator);
    setSelectedStationId(0);
    setIsAssignDialogOpen(true);
  };

  const handleAssignStation = async () => {
    if (!selectedOperator || !selectedStationId) {
      toast.error("Please select a station");
      return;
    }

    try {
      await assignStation(selectedOperator.id, { station_id: selectedStationId });
      toast.success("Station assigned successfully");
      setIsAssignDialogOpen(false);
      
      // Refresh stations for this operator
      const stations = await getOperatorStations(selectedOperator.id);
      setOperatorStations(prev => ({ ...prev, [selectedOperator.id]: stations || [] }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign station"
      );
    }
  };

  const handleUnassignStation = async (operatorId: number, stationId: number) => {
    try {
      await unassignStation(operatorId, stationId);
      toast.success("Station unassigned successfully");
      
      // Refresh stations for this operator
      const stations = await getOperatorStations(operatorId);
      setOperatorStations(prev => ({ ...prev, [operatorId]: stations || [] }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unassign station"
      );
    }
  };

  if (error) {
    return (
      <div className="text-center text-destructive">
        <p>Error loading operators: {error}</p>
        <Button onClick={() => fetchOperators()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Data Table */}
      <DataTable
        dataSource={operators}
        columns={columns}
        loading={loading}
        pagination={{
          currentPage: pagination.current_page,
          total: pagination.total,
          perPage: pagination.per_page,
          lastPage: pagination.last_page,
          onPageChange: handlePageChange,
          showTotal: true,
        }}
        searchable
        exportable
        searchPlaceholder="Search operators..."
        exportFileName="operators"
        searchFields={["username", "email", "phone"]}
      />

      {/* Assign Station Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Station to Operator</DialogTitle>
            <DialogDescription>
              Assign a station to {selectedOperator?.username || "operator"}. The operator will be able to select any gate at this station.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="station">Station</Label>
              <Select
                value={selectedStationId.toString()}
                onValueChange={(value) => setSelectedStationId(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map((station) => (
                    <SelectItem key={station.id} value={station.id.toString()}>
                      {station.name} - {station.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOperator && operatorStations[selectedOperator.id]?.length > 0 && (
              <div className="grid gap-2">
                <Label>Currently Assigned Stations</Label>
                <div className="flex flex-wrap gap-2">
                  {operatorStations[selectedOperator.id].map((station: any) => (
                    <Badge
                      key={station.id}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      {station.name}
                      <button
                        onClick={() => handleUnassignStation(selectedOperator.id, station.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignStation} disabled={!selectedStationId}>
              Assign Station
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

