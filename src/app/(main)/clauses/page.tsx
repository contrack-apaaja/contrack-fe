"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Info, ChevronLeft, ChevronRight, Search, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { clausesApi } from "@/services/api";
import { ClauseDetailModal } from "@/app/components/clauses/ClauseDetailModal";
import { CreateClauseModal } from "@/app/components/clauses/CreateClauseModal";

// =========== INTERFACES (Definisi Tipe Data) ===========
interface ClauseTemplate {
  id: number;
  clause_code: string;
  title: string;
  type: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginationType {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// =========== HELPER FUNCTIONS (Fungsi Bantu) ===========
const getStatusColor = (isActive: boolean) => {
  return isActive
    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-400"
    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-400";
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const ITEMS_PER_PAGE = 8;

// =========== MAIN COMPONENT (Komponen Utama Halaman) ===========
export default function ClausesPage() {
  const [clauses, setClauses] = useState<ClauseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClause, setSelectedClause] = useState<ClauseTemplate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  // Frontend-only state for filtering, sorting, and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all clauses once on component mount
  useEffect(() => {
    const loadClauses = async () => {
      setLoading(true);
      try {
        const response = await clausesApi.getClauses();
        const responseData = response.data as unknown as {
          clause_templates: Array<{
            id: string | number;
            clause_code: string;
            title: string;
            type: string;
            content: string;
            is_active: boolean;
            created_at: string;
            updated_at: string;
          }>;
        };

        if (responseData && Array.isArray(responseData.clause_templates)) {
          const formattedClauses = responseData.clause_templates.map((template) => ({
            ...template,
            id: Number(template.id),
          }));

          setClauses(formattedClauses);
        }
      } catch (error) {
        console.error("Error fetching clauses:", error);
      } finally {
        setLoading(false);
      }
    };

    loadClauses();
  }, [refreshTrigger]);

  // Frontend filtering, sorting, and pagination logic
  const filteredAndSortedClauses = useMemo(() => {
    let filtered = clauses.filter(clause =>
      clause.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clause.clause_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clause.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortField as keyof ClauseTemplate];
        let bValue: any = b[sortField as keyof ClauseTemplate];

        // Handle date sorting
        if (sortField === 'created_at' || sortField === 'updated_at') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        // Handle boolean sorting
        if (sortField === 'is_active') {
          aValue = aValue ? 1 : 0;
          bValue = bValue ? 1 : 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [clauses, searchTerm, sortField, sortDirection]);

  const paginatedClauses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedClauses.slice(startIndex, endIndex);
  }, [filteredAndSortedClauses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedClauses.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleInfoClick = (clause: ClauseTemplate) => {
    setSelectedClause(clause)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedClause(null)
  }

  const handleCreateSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Clauses</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}
          style={{ backgroundColor: "#137fec", color: "#fff" }}>
          <Plus className="mr-2 h-4 w-4" />
          New Clause
        </Button>
      </div>

      {/* Tabel Klausa */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Clauses</CardTitle>
              <CardDescription>Manage and view all clause templates.</CardDescription>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by title, code, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th 
                    className="text-left py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Clause Name</span>
                      {sortField === 'title' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Type</span>
                      {sortField === 'type' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('is_active')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {sortField === 'is_active' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('updated_at')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Last Modified</span>
                      {sortField === 'updated_at' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Info</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </td>
                  </tr>
                ) : Array.isArray(paginatedClauses) && paginatedClauses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No clauses found matching your search.' : 'No clauses found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedClauses.map((clause) => (
                    <tr key={clause.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{clause.title}</p>
                        <p className="text-sm text-muted-foreground">Code: {clause.clause_code}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{clause.type}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={getStatusColor(clause.is_active)}>
                          {clause.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-foreground">{formatDate(clause.updated_at)}</td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" onClick={() => handleInfoClick(clause)}>
                          <Info className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Items per page selector */}
      {!loading && filteredAndSortedClauses.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedClauses.length)} of {filteredAndSortedClauses.length} clauses
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
          
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <ClauseDetailModal
        clause={selectedClause}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleCreateSuccess} // Added onSuccess callback
      />

      {/* Clause Table */}
        <CreateClauseModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
    </div>
  );
}
