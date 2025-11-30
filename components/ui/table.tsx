"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types for table configuration
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  searchable?: boolean;
  hidden?: boolean; // Hide column on mobile
}

export interface DataTableProps<T = any> {
  dataSource: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  searchPlaceholder?: string;
  title?: string;
  exportFileName?: string;
  actionButtons?: React.ReactNode;
  searchFields?: (keyof T)[];
  className?: string;
  pagination?: {
    currentPage: number;
    total: number;
    perPage: number;
    lastPage: number;
    onPageChange?: (page: number) => void;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    showTotal?: boolean;
    pageSizeOptions?: string[];
  };
}

// Table Container with enhanced styling
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-lg shadow-sm"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead data-slot="table-header" className={cn("", className)} {...props} />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody data-slot="table-body" className={cn("", className)} {...props} />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-muted/50 font-medium", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <motion.tr
      data-slot="table-row"
      className={cn(
        "hover:bg-gray-50 dark:hover:bg-gray-800/50 data-[state=selected]:bg-muted transition-colors",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...(props as any)}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-12 px-4 text-left align-middle font-semibold whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] bg-muted/100",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

// Table Toolbar Component
function TableToolbar({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Table Search Component
function TableSearch({
  placeholder = "Search...",
  value,
  onChange,
  className,
  ...props
}: React.ComponentProps<"input"> & {
  placeholder?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          "w-64 h-10 px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-800",
          "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500",
          "placeholder:text-gray-500 dark:placeholder:text-gray-400",
          "transition-colors duration-200"
        )}
        {...props}
      />
      <svg
        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
}

// Export functions
const exportToCSV = <T extends Record<string, any>>(
  dataSource: T[],
  columns: TableColumn<T>[],
  filename: string = "table-data"
) => {
  const headers = columns.map((col) => col.title);
  const csvContent = [
    headers.join(","),
    ...dataSource.map((item) =>
      columns
        .map((col) => {
          const value = col.dataIndex ? item[col.dataIndex] : "";
          return `"${String(value || "").replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToJSON = <T extends Record<string, any>>(
  dataSource: T[],
  filename: string = "table-data"
) => {
  const jsonContent = JSON.stringify(dataSource, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.json`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToExcel = <T extends Record<string, any>>(
  dataSource: T[],
  columns: TableColumn<T>[],
  filename: string = "table-data"
) => {
  // For Excel export, we'll use a simple CSV format that Excel can open
  exportToCSV(dataSource, columns, filename);
};

// Table Actions Component
function TableActions({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

// Pagination Component
function TablePagination({
  currentPage,
  total,
  perPage,
  lastPage,
  onPageChange,
  showTotal = true,
}: {
  currentPage: number;
  total: number;
  perPage: number;
  lastPage: number;
  onPageChange?: (page: number) => void;
  showTotal?: boolean;
}) {
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, total);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= lastPage && onPageChange) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (lastPage <= maxVisiblePages) {
      for (let i = 1; i <= lastPage; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(lastPage);
      } else if (currentPage >= lastPage - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = lastPage - 3; i <= lastPage; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(lastPage);
      }
    }

    return pages;
  };

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800/30">
      {showTotal && (
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Showing {startItem} to {endItem} of {total} results
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <span className="px-2 py-1 text-sm text-gray-500">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page as number)}
                className="min-w-[32px]"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(lastPage)}
          disabled={currentPage === lastPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Enhanced DataTable Component
function DataTable<T extends Record<string, any>>({
  dataSource,
  columns,
  loading = false,
  searchable = true,
  exportable = true,
  searchPlaceholder = "Search...",
  title,
  exportFileName = "data",
  actionButtons,
  searchFields,
  className,
  pagination,
}: DataTableProps<T>) {
  const [searchText, setSearchText] = React.useState("");
  const [filteredData, setFilteredData] = React.useState<T[]>(dataSource);

  // Update filteredData when dataSource changes
  React.useEffect(() => {
    if (!searchText.trim()) {
      setFilteredData(dataSource);
    } else {
      // Re-apply search filter when dataSource changes
      const filtered = dataSource.filter((item) => {
        if (searchFields) {
          return searchFields.some((field) => {
            const fieldValue = item[field];
            if (fieldValue === null || fieldValue === undefined) return false;
            return String(fieldValue)
              .toLowerCase()
              .includes(searchText.toLowerCase());
          });
        }

        // Default search behavior - search through all string fields
        return Object.values(item).some((val) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(searchText.toLowerCase());
        });
      });
      setFilteredData(filtered);
    }
  }, [dataSource, searchText, searchFields]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value.trim()) {
      setFilteredData(dataSource);
      return;
    }

    const filtered = dataSource.filter((item) => {
      if (searchFields) {
        return searchFields.some((field) => {
          const fieldValue = item[field];
          if (fieldValue === null || fieldValue === undefined) return false;
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }

      // Default search behavior - search through all string fields
      return Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(value.toLowerCase());
      });
    });
    setFilteredData(filtered);
  };

  const handleExportCSV = () => {
    exportToCSV(
      filteredData,
      columns,
      exportFileName ||
        title?.toLowerCase().replace(/\s+/g, "-") ||
        "table-data"
    );
  };

  const handleExportJSON = () => {
    exportToJSON(
      filteredData,
      exportFileName ||
        title?.toLowerCase().replace(/\s+/g, "-") ||
        "table-data"
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      filteredData,
      columns,
      exportFileName ||
        title?.toLowerCase().replace(/\s+/g, "-") ||
        "table-data"
    );
  };

  const exportMenuItems = [
    {
      key: "excel",
      icon: <FileSpreadsheet className="mr-2 h-4 w-4" />,
      label: "Excel",
      onClick: handleExportExcel,
    },
    {
      key: "csv",
      icon: <FileText className="mr-2 h-4 w-4" />,
      label: "CSV",
      onClick: handleExportCSV,
    },
    {
      key: "json",
      icon: <FileText className="mr-2 h-4 w-4" />,
      label: "JSON",
      onClick: handleExportJSON,
    },
  ];

  return (
    <motion.div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow-lg",
        className
      )}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {/* Left side - Search */}
          {searchable && (
            <div className="flex-1 max-w-md">
              <TableSearch
                placeholder={searchPlaceholder}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          )}

          {/* Right side - Action buttons and Export */}
          <div className="flex items-center space-x-3">
            {actionButtons && (
              <div className="flex items-center space-x-3">{actionButtons}</div>
            )}

            {exportable && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {exportMenuItems.map((item) => (
                    <DropdownMenuItem key={item.key} onClick={item.onClick}>
                      {item.icon}
                      Export as {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <motion.tr
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {columns.map((column, index) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.width && `w-[${column.width}]`
                  )}
                >
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.1,
                      ease: "easeOut",
                    }}
                  >
                    {column.title}
                  </motion.span>
                </TableHead>
              ))}
            </motion.tr>
          </TableHeader>
          <TableBody>
            {loading ? (
              <motion.tr
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12"
                >
                  <motion.div
                    className="flex items-center justify-center space-x-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <motion.div
                      className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <span className="text-gray-600 dark:text-gray-400">
                      Loading...
                    </span>
                  </motion.div>
                </TableCell>
              </motion.tr>
            ) : filteredData.length === 0 ? (
              <motion.tr
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12 text-gray-500 dark:text-gray-400"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    {searchText
                      ? "No items found matching your search."
                      : "No items found."}
                  </motion.div>
                </TableCell>
              </motion.tr>
            ) : (
              <AnimatePresence>
                {filteredData.map((item, index) => (
                  <motion.tr
                    key={index}
                    data-slot="table-row"
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-gray-800/50 data-[state=selected]:bg-muted transition-colors"
                    )}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right"
                        )}
                      >
                        {column.render
                          ? column.render(
                              column.dataIndex ? item[column.dataIndex] : null,
                              item,
                              index
                            )
                          : column.dataIndex
                          ? String(item[column.dataIndex] || "")
                          : ""}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 p-4">
        {loading ? (
          <motion.div
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading...
            </span>
          </motion.div>
        ) : filteredData.length === 0 ? (
          <motion.div
            className="text-center py-12 text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {searchText
              ? "No items found matching your search."
              : "No items found."}
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredData.map((item, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
              >
                <div className="space-y-3">
                  {columns
                    .filter((col) => col.key !== "actions" && !col.hidden)
                    .map((column) => (
                      <div
                        key={column.key}
                        className="flex flex-col space-y-1 border-b border-gray-100 dark:border-gray-700 last:border-0 pb-2 last:pb-0"
                      >
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {column.title}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {column.render
                            ? column.render(
                                column.dataIndex ? item[column.dataIndex] : null,
                                item,
                                index
                              )
                            : column.dataIndex
                            ? String(item[column.dataIndex] || "-")
                            : "-"}
                        </div>
                      </div>
                    ))}
                  {/* Actions column if exists */}
                  {columns.find((col) => col.key === "actions") && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      {columns
                        .find((col) => col.key === "actions")
                        ?.render?.(null, item, index)}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {pagination && (
        <TablePagination
          currentPage={pagination.currentPage}
          total={pagination.total}
          perPage={pagination.perPage}
          lastPage={pagination.lastPage}
          onPageChange={pagination.onPageChange}
          showTotal={pagination.showTotal}
        />
      )}
    </motion.div>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableToolbar,
  TableSearch,
  TableActions,
  TablePagination,
  DataTable,
};
