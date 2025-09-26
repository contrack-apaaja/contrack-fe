"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Loader2, LogOut, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Info, X, Save, Edit } from "lucide-react";
import { Button } from "@/app/components/Button";
import { Input } from "@/components/ui/input";
import { UltraSimpleSelect } from "@/app/components/ui/ultra-simple-select";
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

  // Create/Update dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    clause_code: '',
    title: '',
    type: '',
    content: '',
    is_active: true
  });

  // Form validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});


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
    const filtered = clauses.filter(clause =>
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
    const newItemsPerPage = parseInt(value);
    setItemsPerPage(newItemsPerPage);
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

  // Handle opening create dialog
  const handleOpenCreateDialog = () => {
    setFormData({
      clause_code: '',
      title: '',
      type: '',
      content: '',
      is_active: true
    });
    setFormErrors({});
    setIsCreateDialogOpen(true);
  };

  // Handle opening update dialog
  const handleOpenUpdateDialog = () => {
    if (selectedClause) {
      setFormData({
        clause_code: selectedClause.clause_code || '',
        title: selectedClause.title,
        type: selectedClause.type,
        content: selectedClause.content || '',
        is_active: selectedClause.is_active
      });
      setFormErrors({});
      setIsUpdateDialogOpen(true);
    }
  };

  // Handle form input changes
  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.clause_code.trim()) {
      errors.clause_code = 'Clause code is required';
    }
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.type.trim()) {
      errors.type = 'Type is required';
    }
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    } else if (formData.content.trim().length < 10) {
      errors.content = 'Content must be at least 10 characters long';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create clause
  const handleCreateClause = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      console.log('🎯 Submitting form data:', formData);
      console.log('🎯 Form data keys:', Object.keys(formData));
      console.log('🎯 Form data values:', Object.values(formData));

      const response = await clausesApi.createClause(formData);
      console.log('🎯 Create response:', response);

      setIsCreateDialogOpen(false);
      setFormData({
        clause_code: '',
        title: '',
        type: '',
        content: '',
        is_active: true
      });
      setError(null); // Clear any previous errors
      // Refresh the clauses list
      fetchClauses();
    } catch (err: any) {
      console.error('❌ Error creating clause:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error headers:', err.response?.headers);

      // Extract detailed validation errors
      let errorMessage = 'Please try again.';

      if (err.response?.data?.error) {
        // If there are specific field validation errors
        const validationErrors = err.response.data.error;
        console.log('🔍 Validation errors:', validationErrors);

        if (typeof validationErrors === 'object') {
          const errorDetails = Object.entries(validationErrors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          errorMessage = `Validation failed: ${errorDetails}`;
        } else {
          errorMessage = `Validation failed: ${validationErrors}`;
        }
      } else {
        errorMessage = err.response?.data?.message ||
                      err.response?.data?.error ||
                      err.message ||
                      'Please try again.';
      }

      setError(`Failed to create clause: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update clause
  const handleUpdateClause = async () => {
    if (!validateForm() || !selectedClause) return;

    setIsSubmitting(true);
    try {
      console.log('Updating clause with ID:', selectedClause.id, 'and data:', formData);
      await clausesApi.updateClause(selectedClause.id, formData);
      setIsUpdateDialogOpen(false);
      setIsDialogOpen(false);
      setSelectedClause(null);
      setError(null); // Clear any previous errors
      // Refresh the clauses list
      fetchClauses();
    } catch (err: any) {
      console.error('Error updating clause:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(`Failed to update clause: ${err.response?.data?.message || err.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle closing create/update dialogs
  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setFormData({
      clause_code: '',
      title: '',
      type: '',
      content: '',
      is_active: true
    });
    setFormErrors({});
  };

  const handleCloseUpdateDialog = () => {
    setIsUpdateDialogOpen(false);
    setFormErrors({});
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
    <div className="flex min-h-screen bg-white">
      <div className="container mx-auto py-8 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary">Clauses</h1>
          <div className="flex items-center space-x-3">
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleOpenCreateDialog}
            >
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
               <UltraSimpleSelect
                 value={itemsPerPage.toString()}
                 onValueChange={handleItemsPerPageChange}
                 options={[
                   { value: "5", label: "5" },
                   { value: "10", label: "10" },
                   { value: "25", label: "25" },
                   { value: "50", label: "50" },
                   { value: "100", label: "100" }
                 ]}
                 className="w-20"
               />
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
               <Button variant="primary" onClick={handleOpenUpdateDialog}>
                 <Edit className="h-4 w-4 mr-2" />
                 Edit Clause
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>

         {/* Create Clause Dialog */}
         <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <div className="flex items-center justify-between">
                 <div>
                   <DialogTitle className="text-2xl font-bold text-gray-900">
                     Create New Clause
                   </DialogTitle>
                   <DialogDescription className="mt-2">
                     Fill in the details to create a new clause template
                   </DialogDescription>
                 </div>
                 <Button
                   variant="ghost"
                   onClick={handleCloseCreateDialog}
                   className="h-8 w-8 p-0 hover:bg-gray-100"
                 >
                   <X className="h-4 w-4" />
                 </Button>
               </div>
             </DialogHeader>

             <div className="p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Clause Code */}
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">
                     Clause Code *
                   </label>
                   <Input
                     value={formData.clause_code}
                     onChange={(e) => handleFormChange('clause_code', e.target.value)}
                     placeholder="e.g., PAYMENT_001"
                     className={formErrors.clause_code ? 'border-red-500' : ''}
                   />
                   {formErrors.clause_code && (
                     <p className="text-sm text-red-600">{formErrors.clause_code}</p>
                   )}
                 </div>

                 {/* Title */}
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">
                     Title *
                   </label>
                   <Input
                     value={formData.title}
                     onChange={(e) => handleFormChange('title', e.target.value)}
                     placeholder="e.g., Standard Payment Terms"
                     className={formErrors.title ? 'border-red-500' : ''}
                   />
                   {formErrors.title && (
                     <p className="text-sm text-red-600">{formErrors.title}</p>
                   )}
                 </div>
               </div>

               {/* Type */}
               <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">
                   Type *
                 </label>
                 <Input
                   value={formData.type}
                   onChange={(e) => handleFormChange('type', e.target.value)}
                   placeholder="e.g., Payment, Legal, Terms"
                   className={formErrors.type ? 'border-red-500' : ''}
                 />
                 {formErrors.type && (
                   <p className="text-sm text-red-600">{formErrors.type}</p>
                 )}
               </div>

               {/* Content */}
               <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">
                   Content *
                 </label>
                 <textarea
                   value={formData.content}
                   onChange={(e) => handleFormChange('content', e.target.value)}
                   placeholder="Enter the detailed clause content..."
                   rows={6}
                   className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                     formErrors.content ? 'border-red-500' : 'border-gray-300'
                   }`}
                 />
                 {formErrors.content && (
                   <p className="text-sm text-red-600">{formErrors.content}</p>
                 )}
               </div>

               {/* Active Status Toggle */}
               <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">
                   Status
                 </label>
                 <div className="flex space-x-2">
                   <button
                     type="button"
                     onClick={() => handleFormChange('is_active', true)}
                     className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                       formData.is_active
                         ? 'bg-blue-500 text-white shadow-md'
                         : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                     }`}
                   >
                     Active
                   </button>
                   <button
                     type="button"
                     onClick={() => handleFormChange('is_active', false)}
                     className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                       !formData.is_active
                         ? 'bg-red-500 text-white shadow-md'
                         : 'bg-red-100 text-red-600 hover:bg-red-200'
                     }`}
                   >
                     Inactive
                   </button>
                 </div>
               </div>
             </div>

             <DialogFooter>
               <Button variant="secondary" onClick={handleCloseCreateDialog}>
                 Cancel
               </Button>
               <Button
                 variant="primary"
                 onClick={handleCreateClause}
                 disabled={isSubmitting}
               >
                 {isSubmitting ? (
                   <>
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     Creating...
                   </>
                 ) : (
                   <>
                     <Save className="h-4 w-4 mr-2" />
                     Create Clause
                   </>
                 )}
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>

         {/* Update Clause Dialog */}
         <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <div className="flex items-center justify-between">
                 <div>
                   <DialogTitle className="text-2xl font-bold text-gray-900">
                     Update Clause
                   </DialogTitle>
                   <DialogDescription className="mt-2">
                     Modify the clause details below
                   </DialogDescription>
                 </div>
                 <Button
                   variant="ghost"
                   onClick={handleCloseUpdateDialog}
                   className="h-8 w-8 p-0 hover:bg-gray-100"
                 >
                   <X className="h-4 w-4" />
                 </Button>
               </div>
             </DialogHeader>

             <div className="p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Clause Code */}
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">
                     Clause Code *
                   </label>
                   <Input
                     value={formData.clause_code}
                     onChange={(e) => handleFormChange('clause_code', e.target.value)}
                     placeholder="e.g., PAYMENT_001"
                     className={formErrors.clause_code ? 'border-red-500' : ''}
                   />
                   {formErrors.clause_code && (
                     <p className="text-sm text-red-600">{formErrors.clause_code}</p>
                   )}
                 </div>

                 {/* Title */}
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">
                     Title *
                   </label>
                   <Input
                     value={formData.title}
                     onChange={(e) => handleFormChange('title', e.target.value)}
                     placeholder="e.g., Standard Payment Terms"
                     className={formErrors.title ? 'border-red-500' : ''}
                   />
                   {formErrors.title && (
                     <p className="text-sm text-red-600">{formErrors.title}</p>
                   )}
                 </div>
               </div>

               {/* Type */}
               <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">
                   Type *
                 </label>
                 <Input
                   value={formData.type}
                   onChange={(e) => handleFormChange('type', e.target.value)}
                   placeholder="e.g., Payment, Legal, Terms"
                   className={formErrors.type ? 'border-red-500' : ''}
                 />
                 {formErrors.type && (
                   <p className="text-sm text-red-600">{formErrors.type}</p>
                 )}
               </div>

               {/* Content */}
               <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">
                   Content *
                 </label>
                 <textarea
                   value={formData.content}
                   onChange={(e) => handleFormChange('content', e.target.value)}
                   placeholder="Enter the detailed clause content..."
                   rows={6}
                   className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                     formErrors.content ? 'border-red-500' : 'border-gray-300'
                   }`}
                 />
                 {formErrors.content && (
                   <p className="text-sm text-red-600">{formErrors.content}</p>
                 )}
               </div>

               {/* Active Status Toggle */}
               <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">
                   Status
                 </label>
                 <div className="flex space-x-2">
                   <button
                     type="button"
                     onClick={() => handleFormChange('is_active', true)}
                     className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                       formData.is_active
                         ? 'bg-blue-500 text-white shadow-md'
                         : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                     }`}
                   >
                     Active
                   </button>
                   <button
                     type="button"
                     onClick={() => handleFormChange('is_active', false)}
                     className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                       !formData.is_active
                         ? 'bg-red-500 text-white shadow-md'
                         : 'bg-red-100 text-red-600 hover:bg-red-200'
                     }`}
                   >
                     Inactive
                   </button>
                 </div>
               </div>
             </div>

             <DialogFooter>
               <Button variant="secondary" onClick={handleCloseUpdateDialog}>
                 Cancel
               </Button>
               <Button
                 variant="primary"
                 onClick={handleUpdateClause}
                 disabled={isSubmitting}
               >
                 {isSubmitting ? (
                   <>
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     Updating...
                   </>
                 ) : (
                   <>
                     <Save className="h-4 w-4 mr-2" />
                     Update Clause
                   </>
                 )}
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>

      </div>
    </div>
  );
}
