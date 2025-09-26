"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Info, ChevronLeft, ChevronRight, Search, Plus } from "lucide-react";
import { clausesApi } from "@/services/api";

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

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // useEffect for debouncing input search from the user
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // useEffect to fetch data from API using clausesApi
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
          pagination: PaginationType;
        };

        console.log('Response:', responseData); // Debug log

        if (responseData && Array.isArray(responseData.clause_templates)) {
          const { clause_templates, pagination } = responseData;

          const formattedClauses = clause_templates.map((template) => ({
            ...template,
            id: Number(template.id),
          }));

          console.log('Formatted Clauses:', formattedClauses); // Debug log

          setClauses(formattedClauses);
          setPagination(pagination);
        }
      } catch (error) {
        console.error("Error fetching clauses:", error);
      } finally {
        setLoading(false);
      }
    };

    loadClauses();
  }, [currentPage, debouncedSearchQuery]);

  const handlePreviousPage = () => {
    if (pagination.has_prev) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (pagination.has_next) setCurrentPage((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Clauses</h1>
        <Button
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
                placeholder="Search by title or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Clause Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Modified</th>
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
                ) : Array.isArray(clauses) && clauses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No clauses found.
                    </td>
                  </tr>
                ) : (
                  clauses.map((clause) => (
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
                        <Button variant="ghost" size="icon">
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

      {/* Paginasi */}
      {!loading && pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} clauses
          </p>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={!pagination.has_prev}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm font-medium">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={!pagination.has_next}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
