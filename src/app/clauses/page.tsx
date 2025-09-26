"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Loader2, LogOut, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import { Button } from "@/app/components/Button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { clausesApi, ClauseTemplate, PaginationInfo, authUtils } from "@/services/api";

export default function ClausesPage() {
  const [clauses, setClauses] = useState<ClauseTemplate[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // New state for enhanced features
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof ClauseTemplate | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClause, setSelectedClause] = useState<ClauseTemplate | null>(null);
  

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authUtils.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (!authenticated) {
        window.location.href = '/login';
        return;
      }
    };
    
    checkAuth();
  }, []);

  // Fetch clauses from API
  const fetchClauses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await clausesApi.getClauses();
      console.log(response.data);
      setClauses(response.data.clause_templates);
      setPagination(response.data.pagination);
    } catch (err) {
      setError("Failed to fetch clauses. Please try again.");
      console.error("Error fetching clauses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch clauses when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchClauses();
    }
  }, [isAuthenticated]);

  // Filter and sort clauses
  const filteredAndSortedClauses = useMemo(() => {
    let filtered = clauses.filter(clause =>
      clause.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          return sortDirection === 'asc' 
            ? (aValue === bValue ? 0 : aValue ? 1 : -1)
            : (aValue === bValue ? 0 : aValue ? -1 : 1);
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string' && 
            (sortField === 'updated_at' || sortField === 'created_at')) {
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);
          return sortDirection === 'asc' 
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }
        
        return 0;
      });
    }

    return filtered;
  }, [clauses, searchTerm, sortField, sortDirection]);

  // Paginate filtered results
  const paginatedClauses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedClauses.slice(startIndex, endIndex);
  }, [filteredAndSortedClauses, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredAndSortedClauses.length / itemsPerPage);

  // Handle sorting
  const handleSort = (field: keyof ClauseTemplate) => {
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
    setCurrentPage(1); // Reset to first page
  };

  // Handle opening clause details dialog
  const handleOpenClauseDetails = (clause: ClauseTemplate) => {
    setSelectedClause(clause);
    setIsDialogOpen(true);
  };

  // Handle closing dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedClause(null);
  };


  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Get status display
  const getStatusDisplay = (isActive: boolean) => {
    return isActive ? "Active" : "Inactive";
  };

  // Handle logout
  const handleLogout = () => {
    authUtils.logout();
  };

  // Show loading if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-gray-600">Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary">Clauses</h1>
          <div className="flex items-center space-x-3">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Clause
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleLogout}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>


         {/* Error Message */}
         {error && (
           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
             <p className="text-red-600">{error}</p>
           </div>
         )}

         {/* Search Bar */}
         <div className="mb-6">
           <div className="relative max-w-md">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
             <Input
               type="text"
               placeholder="Search clauses by name..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10"
             />
           </div>
         </div>

         {/* Table */}
         <div className="border border-gray-300 rounded-xl bg-white shadow-sm">
           <Table>
             <TableHeader>
               <TableRow className="border-b border-gray-300">
                 <TableHead 
                   className="font-semibold text-black cursor-pointer hover:bg-gray-50 select-none"
                   onClick={() => handleSort('title')}
                 >
                   <div className="flex items-center space-x-1">
                     <span>Clause Name</span>
                     {sortField === 'title' && (
                       sortDirection === 'asc' ? 
                         <ChevronUp className="h-4 w-4" /> : 
                         <ChevronDown className="h-4 w-4" />
                     )}
                   </div>
                 </TableHead>
                 <TableHead 
                   className="font-semibold text-black cursor-pointer hover:bg-gray-50 select-none"
                   onClick={() => handleSort('type')}
                 >
                   <div className="flex items-center space-x-1">
                     <span>Type</span>
                     {sortField === 'type' && (
                       sortDirection === 'asc' ? 
                         <ChevronUp className="h-4 w-4" /> : 
                         <ChevronDown className="h-4 w-4" />
                     )}
                   </div>
                 </TableHead>
                 <TableHead 
                   className="font-semibold text-black cursor-pointer hover:bg-gray-50 select-none"
                   onClick={() => handleSort('is_active')}
                 >
                   <div className="flex items-center space-x-1">
                     <span>Status</span>
                     {sortField === 'is_active' && (
                       sortDirection === 'asc' ? 
                         <ChevronUp className="h-4 w-4" /> : 
                         <ChevronDown className="h-4 w-4" />
                     )}
                   </div>
                 </TableHead>
                 <TableHead 
                   className="font-semibold text-black cursor-pointer hover:bg-gray-50 select-none"
                   onClick={() => handleSort('updated_at')}
                 >
                   <div className="flex items-center space-x-1">
                     <span>Last Modified</span>
                     {sortField === 'updated_at' && (
                       sortDirection === 'asc' ? 
                         <ChevronUp className="h-4 w-4" /> : 
                         <ChevronDown className="h-4 w-4" />
                     )}
                   </div>
                 </TableHead>
                 <TableHead className="font-semibold text-black text-center w-16">
                   Info
                 </TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loading ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-8">
                     <div className="flex items-center justify-center">
                       <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                       <span className="text-gray-600">Loading clauses...</span>
                     </div>
                   </TableCell>
                 </TableRow>
               ) : paginatedClauses.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-8">
                     <span className="text-gray-600">
                       {searchTerm ? 'No clauses found matching your search' : 'No clauses found'}
                     </span>
                   </TableCell>
                 </TableRow>
               ) : (
                 paginatedClauses.map((clause) => (
                   <TableRow key={clause.id} className="border-b border-gray-300 hover:bg-primary/5">
                     <TableCell className="font-medium text-black">{clause.title}</TableCell>
                     <TableCell className="text-black">{clause.type}</TableCell>
                     <TableCell>
                       <span
                         className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           clause.is_active
                             ? "bg-blue-100 text-blue-800"
                             : "bg-gray-100 text-gray-800"
                         }`}
                       >
                         {getStatusDisplay(clause.is_active)}
                       </span>
                     </TableCell>
                     <TableCell className="text-black">{formatDate(clause.updated_at)}</TableCell>
                     <TableCell className="text-center">
                       <Button
                         variant="ghost"
                         onClick={() => handleOpenClauseDetails(clause)}
                         className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                       >
                         <Info className="h-4 w-4 text-primary" />
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>

         {/* Pagination Controls */}
         {!loading && filteredAndSortedClauses.length > 0 && (
           <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
             {/* Items per page selector */}
             <div className="flex items-center space-x-2">
               <span className="text-sm text-gray-600">Show</span>
               <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                 <SelectTrigger className="w-20">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="5">5</SelectItem>
                   <SelectItem value="10">10</SelectItem>
                   <SelectItem value="25">25</SelectItem>
                   <SelectItem value="50">50</SelectItem>
                   <SelectItem value="100">100</SelectItem>
                 </SelectContent>
               </Select>
               <span className="text-sm text-gray-600">items per page</span>
             </div>

             {/* Pagination info */}
             <div className="text-sm text-gray-600">
               Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedClauses.length)} of {filteredAndSortedClauses.length} results
             </div>

             {/* Pagination buttons */}
             <div className="flex items-center space-x-2">
               <Button
                 variant="secondary"
                 onClick={() => handlePageChange(currentPage - 1)}
                 disabled={currentPage === 1}
                 className="flex items-center space-x-1 text-sm px-3 py-1"
               >
                 <ChevronLeft className="h-4 w-4" />
                 <span>Previous</span>
               </Button>
               
               {/* Page numbers */}
               <div className="flex items-center space-x-1">
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
                       variant={currentPage === pageNum ? "primary" : "secondary"}
                       onClick={() => handlePageChange(pageNum)}
                       className="w-8 h-8 p-0 text-sm"
                     >
                       {pageNum}
                     </Button>
                   );
                 })}
               </div>

               <Button
                 variant="secondary"
                 onClick={() => handlePageChange(currentPage + 1)}
                 disabled={currentPage === totalPages}
                 className="flex items-center space-x-1 text-sm px-3 py-1"
               >
                 <span>Next</span>
                 <ChevronRight className="h-4 w-4" />
               </Button>
             </div>
           </div>
         )}

         {/* Clause Details Dialog */}
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <div className="flex items-center justify-between">
                 <div>
                   <DialogTitle className="text-2xl font-bold text-gray-900">
                     {selectedClause?.title}
                   </DialogTitle>
                   <DialogDescription className="mt-2">
                     Clause Details and Information
                   </DialogDescription>
                 </div>
                 <Button
                   variant="ghost"
                   onClick={handleCloseDialog}
                   className="h-8 w-8 p-0 hover:bg-gray-100"
                 >
                   <X className="h-4 w-4" />
                 </Button>
               </div>
             </DialogHeader>
             
             {selectedClause && (
               <div className="p-6 space-y-6">
                 {/* Basic Information */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <div>
                       <label className="text-sm font-medium text-gray-500">Clause ID</label>
                       <p className="text-sm text-gray-900 font-mono">{selectedClause.id}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Type</label>
                       <p className="text-sm text-gray-900">{selectedClause.type}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Status</label>
                       <span
                         className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           selectedClause.is_active
                             ? "bg-green-100 text-green-800"
                             : "bg-red-100 text-red-800"
                         }`}
                       >
                         {getStatusDisplay(selectedClause.is_active)}
                       </span>
                     </div>
                   </div>
                   
                   <div className="space-y-4">
                     <div>
                       <label className="text-sm font-medium text-gray-500">Created At</label>
                       <p className="text-sm text-gray-900">{formatDate(selectedClause.created_at)}</p>
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-500">Last Modified</label>
                       <p className="text-sm text-gray-900">{formatDate(selectedClause.updated_at)}</p>
                     </div>
                   </div>
                 </div>

                 {/* Clause Content Section */}
                 <div className="border-t pt-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Clause Content</h3>
                   <div className="bg-gray-50 rounded-lg p-4">
                     <p className="text-sm text-gray-700 leading-relaxed">
                       This is where the detailed clause content would be displayed. 
                       The actual content would come from the backend API response.
                       For now, this is a placeholder to show the structure of the dialog.
                     </p>
                     <p className="text-sm text-gray-700 leading-relaxed mt-3">
                       In a real implementation, you would fetch the full clause content 
                       from the API using the clause ID: <code className="bg-gray-200 px-1 rounded">{selectedClause.id}</code>
                     </p>
                   </div>
                 </div>

                 {/* Additional Information */}
                 <div className="border-t pt-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-blue-50 rounded-lg p-4">
                       <h4 className="font-medium text-blue-900 mb-2">Usage Statistics</h4>
                       <p className="text-sm text-blue-700">
                         This clause has been used in 0 contracts.
                       </p>
                     </div>
                     <div className="bg-green-50 rounded-lg p-4">
                       <h4 className="font-medium text-green-900 mb-2">Version History</h4>
                       <p className="text-sm text-green-700">
                         Current version: 1.0
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             )}

             <DialogFooter>
               <Button variant="secondary" onClick={handleCloseDialog}>
                 Close
               </Button>
               <Button variant="primary">
                 Edit Clause
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>

      </div>
    </div>
  );
}
