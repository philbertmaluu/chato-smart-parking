"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type TableColumn } from "@/components/ui/table";
import { useBundleSubscriptions, type BundleSubscription, type CreateBundleSubscriptionData, type UpdateBundleSubscriptionData } from "@/hooks/use-bundle-subscriptions";
import { useAccounts } from "@/hooks/use-accounts";
import { useBundles } from "@/hooks/use-bundles";
import { Plus, Search, Edit, Trash2, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/date-utils";
import { formatCurrency } from "@/utils/currency-formater";

export function BundleSubscriptionsTable() {
  const {
    bundleSubscriptions,
    loading,
    error,
    pagination,
    fetchBundleSubscriptions,
    createBundleSubscription,
    updateBundleSubscription,
    deleteBundleSubscription,
    updateBundleSubscriptionStatus,
    handlePageChange,
  } = useBundleSubscriptions();

  const { accounts, fetchAccounts } = useAccounts();
  const { bundles, fetchBundles } = useBundles();

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<BundleSubscription | null>(null);
  const [openStatusDropdowns, setOpenStatusDropdowns] = useState<Record<number, boolean>>({});

  // Form states
  const [formData, setFormData] = useState<CreateBundleSubscriptionData>({
    account_id: 0,
    bundle_id: 0,
    start_datetime: "",
    end_datetime: "",
    amount: 0,
    passages_used: 0,
    max_passages: undefined,
    status: "active",
    auto_renew: false,
  });

  useEffect(() => {
    fetchBundleSubscriptions();
    fetchAccounts();
    fetchBundles();
  }, [fetchBundleSubscriptions, fetchAccounts, fetchBundles]);

  const handleCreateSubscription = async () => {
    try {
      await createBundleSubscription(formData);
      setIsCreateDialogOpen(false);
      setFormData({
        account_id: 0,
        bundle_id: 0,
        start_datetime: "",
        end_datetime: "",
        amount: 0,
        passages_used: 0,
        max_passages: undefined,
        status: "active",
        auto_renew: false,
      });
      toast.success("Bundle subscription created successfully");
    } catch (error) {
      toast.error("Failed to create bundle subscription");
    }
  };

  const handleEditSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      await updateBundleSubscription({
        id: selectedSubscription.id,
        ...formData,
      });
      setIsEditDialogOpen(false);
      setSelectedSubscription(null);
      toast.success("Bundle subscription updated successfully");
    } catch (error) {
      toast.error("Failed to update bundle subscription");
    }
  };

  const handleDeleteSubscription = async (id: number) => {
    try {
      await deleteBundleSubscription(id);
      toast.success("Bundle subscription deleted successfully");
    } catch (error) {
      toast.error("Failed to delete bundle subscription");
    }
  };

  const handleStatusChange = async (subscription: BundleSubscription, newStatus: string) => {
    try {
      await updateBundleSubscriptionStatus(subscription.id, newStatus);
      toast.success(`Subscription status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update subscription status");
    }
  };

  const handleAutoRenewChange = async (subscription: BundleSubscription, autoRenew: boolean) => {
    try {
      await updateBundleSubscription({
        id: subscription.id,
        account_id: subscription.account_id,
        bundle_id: subscription.bundle_id,
        start_datetime: subscription.start_datetime,
        end_datetime: subscription.end_datetime,
        amount: subscription.amount,
        passages_used: subscription.passages_used,
        max_passages: subscription.max_passages,
        status: subscription.status,
        auto_renew: autoRenew,
      });
      toast.success(`Auto renew ${autoRenew ? "enabled" : "disabled"}`);
    } catch (error) {
      toast.error("Failed to update auto renew setting");
    }
  };

  const openEditDialog = (subscription: BundleSubscription) => {
    setSelectedSubscription(subscription);
    setFormData({
      account_id: subscription.account_id,
      bundle_id: subscription.bundle_id,
      start_datetime: subscription.start_datetime,
      end_datetime: subscription.end_datetime,
      amount: subscription.amount,
      passages_used: subscription.passages_used,
      max_passages: subscription.max_passages,
      status: subscription.status,
      auto_renew: subscription.auto_renew,
    });
    setIsEditDialogOpen(true);
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "expired":
        return "destructive";
      case "cancelled":
        return "secondary";
      case "suspended":
        return "outline";
      default:
        return "secondary";
    }
  };

  const columns: TableColumn<BundleSubscription>[] = [
    {
      key: "subscription_number",
      title: "Subscription #",
      dataIndex: "subscription_number",
      searchable: true,
    },
    {
      key: "account",
      title: "Customer",
      searchable: true,
      render: (_, record: BundleSubscription) => {
        return record.account ? (
          <div>
            <div className="font-medium">
              {record.account.name}
            </div>
            <div className="text-sm text-muted-foreground">
              {record.account.account_number}
            </div>
            {record.account.customer && (
              <div className="text-sm text-muted-foreground">
                {record.account.customer.first_name} {record.account.customer.last_name}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">No account</span>
        );
      },
    },
    {
      key: "bundle",
      title: "Bundle",
      searchable: true,
      render: (_, record: BundleSubscription) => {
        return record.bundle ? (
          <div>
            <div className="font-medium">{record.bundle.name}</div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(record.bundle.amount)}
            </div>
            {record.bundle.bundle_type && (
              <div className="text-sm text-muted-foreground">
                {record.bundle.bundle_type.name}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">No bundle</span>
        );
      },
    },
    {
      key: "amount",
      title: "Amount",
      dataIndex: "amount",
      render: (_, record: BundleSubscription) => {
        return formatCurrency(record.amount);
      },
    },
    {
      key: "passages_used",
      title: "Usage",
      render: (_, record: BundleSubscription) => {
        const used = record.passages_used;
        const max = record.max_passages || record.bundle?.max_passages || "∞";
        
        return (
          <div className="text-center">
            <div className="font-medium">{used}</div>
            <div className="text-sm text-muted-foreground">
              / {max === "∞" ? "∞" : max}
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (_, record: BundleSubscription) => {
        const status = record.status;
        const getStatusEmoji = (status: string) => {
          switch (status) {
            case "active":
              return "🟢";
            case "suspended":
              return "🟡";
            case "cancelled":
              return "🔴";
            case "expired":
              return "⚫";
            default:
              return "⚪";
          }
        };
        
        const isOpen = openStatusDropdowns[record.id] || false;
        
        return (
          <DropdownMenu 
            onOpenChange={(open) => 
              setOpenStatusDropdowns(prev => ({ ...prev, [record.id]: open }))
            }
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 justify-start">
                <span className="mr-2">{getStatusEmoji(status)}</span>
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 ml-auto" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-auto" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleStatusChange(record, "active")}>
                <span className="mr-2">🟢</span>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(record, "suspended")}>
                <span className="mr-2">🟡</span>
                Suspended
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(record, "cancelled")}>
                <span className="mr-2">🔴</span>
                Cancelled
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(record, "expired")}>
                <span className="mr-2">⚫</span>
                Expired
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      key: "start_datetime",
      title: "Start Date",
      dataIndex: "start_datetime",
      render: (_, record: BundleSubscription) => {
        return formatDate(record.start_datetime);
      },
    },
    {
      key: "end_datetime",
      title: "End Date",
      dataIndex: "end_datetime",
      render: (_, record: BundleSubscription) => {
        return formatDate(record.end_datetime);
      },
    },
    {
      key: "auto_renew",
      title: "Auto Renew",
      dataIndex: "auto_renew",
      render: (_, record: BundleSubscription) => {
        const autoRenew = record.auto_renew;
        return (
          <Switch
            checked={autoRenew}
            onCheckedChange={(checked) => handleAutoRenewChange(record, checked)}
            disabled={loading}
          />
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (_, record: BundleSubscription) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditDialog(record)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Bundle Subscription</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this bundle subscription? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteSubscription(record.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>Error loading bundle subscriptions: {error}</p>
            <Button onClick={() => fetchBundleSubscriptions()} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Data Table */}
      <DataTable
        dataSource={bundleSubscriptions}
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
        searchPlaceholder="Search subscriptions..."
        exportFileName="bundle-subscriptions"
        searchFields={["subscription_number", "status"]}
        actionButtons={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Bundle Subscription</DialogTitle>
                <DialogDescription>
                  Create a new bundle subscription for a customer account.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="account_id">Customer Account</Label>
                  <Select
                    value={formData.account_id.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, account_id: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select customer account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account: any) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name} - {account.account_number}
                          {account.customer && (
                            <span> ({account.customer.first_name} {account.customer.last_name})</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bundle_id">Bundle</Label>
                  <Select
                    value={formData.bundle_id.toString()}
                    onValueChange={(value) => {
                      const bundleId = parseInt(value);
                      const selectedBundle = bundles.find((b: any) => b.id === bundleId);
                      setFormData({ 
                        ...formData, 
                        bundle_id: bundleId,
                        amount: selectedBundle?.amount || 0,
                        max_passages: selectedBundle?.max_passages || undefined
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select bundle" />
                    </SelectTrigger>
                    <SelectContent>
                      {bundles.map((bundle: any) => (
                        <SelectItem key={bundle.id} value={bundle.id.toString()}>
                          {bundle.name} - {formatCurrency(bundle.amount)}
                          {bundle.max_passages && (
                            <span> ({bundle.max_passages} passages)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_datetime">Start Date & Time</Label>
                    <Input
                      id="start_datetime"
                      type="datetime-local"
                      value={formData.start_datetime}
                      onChange={(e) =>
                        setFormData({ ...formData, start_datetime: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_datetime">End Date & Time</Label>
                    <Input
                      id="end_datetime"
                      type="datetime-local"
                      value={formData.end_datetime}
                      onChange={(e) =>
                        setFormData({ ...formData, end_datetime: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="passages_used">Passages Used</Label>
                    <Input
                      id="passages_used"
                      type="number"
                      value={formData.passages_used}
                      onChange={(e) =>
                        setFormData({ ...formData, passages_used: parseInt(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
                {formData.max_passages && (
                  <div className="grid gap-2">
                    <Label htmlFor="max_passages">Max Passages</Label>
                    <Input
                      id="max_passages"
                      type="number"
                      value={formData.max_passages}
                      onChange={(e) =>
                        setFormData({ ...formData, max_passages: parseInt(e.target.value) || undefined })
                      }
                      placeholder="Unlimited"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "expired" | "cancelled" | "suspended") =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="auto_renew">Auto Renew</Label>
                    <Select
                      value={formData.auto_renew?.toString() || "false"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, auto_renew: value === "true" })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateSubscription}>Create Subscription</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Bundle Subscription</DialogTitle>
            <DialogDescription>
              Update bundle subscription information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_account_id">Customer Account</Label>
              <Select
                value={formData.account_id.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, account_id: parseInt(value) })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select customer account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} - {account.account_number}
                      {account.customer && (
                        <span> ({account.customer.first_name} {account.customer.last_name})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_bundle_id">Bundle</Label>
              <Select
                value={formData.bundle_id.toString()}
                onValueChange={(value) => {
                  const bundleId = parseInt(value);
                  const selectedBundle = bundles.find((b: any) => b.id === bundleId);
                  setFormData({ 
                    ...formData, 
                    bundle_id: bundleId,
                    amount: selectedBundle?.amount || formData.amount,
                    max_passages: selectedBundle?.max_passages || formData.max_passages
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select bundle" />
                </SelectTrigger>
                <SelectContent>
                  {bundles.map((bundle: any) => (
                    <SelectItem key={bundle.id} value={bundle.id.toString()}>
                      {bundle.name} - {formatCurrency(bundle.amount)}
                      {bundle.max_passages && (
                        <span> ({bundle.max_passages} passages)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_start_datetime">Start Date & Time</Label>
                <Input
                  id="edit_start_datetime"
                  type="datetime-local"
                  value={formData.start_datetime}
                  onChange={(e) =>
                    setFormData({ ...formData, start_datetime: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_end_datetime">End Date & Time</Label>
                <Input
                  id="edit_end_datetime"
                  type="datetime-local"
                  value={formData.end_datetime}
                  onChange={(e) =>
                    setFormData({ ...formData, end_datetime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_amount">Amount</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_passages_used">Passages Used</Label>
                <Input
                  id="edit_passages_used"
                  type="number"
                  value={formData.passages_used}
                  onChange={(e) =>
                    setFormData({ ...formData, passages_used: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            {formData.max_passages && (
              <div className="grid gap-2">
                <Label htmlFor="edit_max_passages">Max Passages</Label>
                <Input
                  id="edit_max_passages"
                  type="number"
                  value={formData.max_passages}
                  onChange={(e) =>
                    setFormData({ ...formData, max_passages: parseInt(e.target.value) || undefined })
                  }
                  placeholder="Unlimited"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "expired" | "cancelled" | "suspended") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_auto_renew">Auto Renew</Label>
                <Select
                  value={formData.auto_renew?.toString() || "false"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, auto_renew: value === "true" })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubscription}>Update Subscription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}