import { useState, useEffect, useRef } from 'react';
import { Books, Plus, PencilSimple, Trash, CircleNotch, X, Check, ArrowClockwise, CaretDown, MagnifyingGlass } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';

import AdminLayout from '../../layouts/AdminLayout';
import { getBooks, getGenres, createBook, updateBook, deleteBook, getAuthors, getPublishers, createAuthor, createPublisher } from '../../api/booksApi';
import type { BookResponse, GenreResponse } from '../../types/books.types';

interface Option {
  id: number;
  name: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder: string;
  quickAddNode?: React.ReactNode;
}

function MultiSelectDropdown({
  label,
  options,
  selectedIds,
  onChange,
  placeholder,
  quickAddNode
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = (options || []).filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeOption = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(x => x !== id));
  };

  const selectedOptions = (options || []).filter(opt => selectedIds.includes(opt.id));

  return (
    <div className="flex flex-col gap-1 relative w-full" ref={containerRef}>
      <div className="flex justify-between items-center h-4">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none">{label}</label>
        {quickAddNode}
      </div>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`min-h-10 p-2 border rounded-xl bg-white cursor-pointer transition-all flex flex-wrap items-center gap-1.5 pr-8 relative ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-xs text-slate-400 pl-1">{placeholder}</span>
        ) : (
          selectedOptions.map(opt => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1 bg-indigo-50/60 text-indigo-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-indigo-100/70"
            >
              {opt.name}
              <button
                type="button"
                onClick={(e) => removeOption(opt.id, e)}
                className="text-indigo-400 hover:text-indigo-650 transition-colors cursor-pointer"
              >
                <X size={10} weight="bold" />
              </button>
            </span>
          ))
        )}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <CaretDown size={14} weight="bold" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-[99] left-0 right-0 top-[102%] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-60"
          >
            <div className="p-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 shrink-0">
              <MagnifyingGlass size={14} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Search..."
                className="w-full text-xs bg-transparent outline-none border-none p-0 text-slate-700 placeholder:text-slate-400"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-650">
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 py-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No results found</div>
              ) : (
                filteredOptions.map(opt => {
                  const isSelected = selectedIds.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => toggleOption(opt.id)}
                      className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/50 text-indigo-700 font-extrabold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.name}</span>
                      {isSelected && <Check size={14} weight="bold" className="text-indigo-600" />}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SingleSelectProps {
  label: string;
  options: Option[];
  selectedId: number | '';
  onChange: (id: number | '') => void;
  placeholder: string;
  quickAddNode?: React.ReactNode;
}

function SingleSelectDropdown({
  label,
  options,
  selectedId,
  onChange,
  placeholder,
  quickAddNode
}: SingleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = (options || []).filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectOption = (id: number) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  const selectedOpt = (options || []).find(opt => opt.id === selectedId);

  return (
    <div className="flex flex-col gap-1 relative w-full" ref={containerRef}>
      <div className="flex justify-between items-center h-4">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none">{label}</label>
        {quickAddNode}
      </div>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`h-10 px-3 border rounded-xl bg-white cursor-pointer transition-all flex items-center justify-between pr-8 relative text-xs text-slate-700 ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {selectedOpt ? (
          <span className="font-semibold">{selectedOpt.name}</span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <CaretDown size={14} weight="bold" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-[99] left-0 right-0 top-[102%] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-60"
          >
            <div className="p-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 shrink-0">
              <MagnifyingGlass size={14} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Search..."
                className="w-full text-xs bg-transparent outline-none border-none p-0 text-slate-700 placeholder:text-slate-400"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-650">
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 py-1">
              <div
                onClick={() => { onChange(''); setIsOpen(false); }}
                className="px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 cursor-pointer italic"
              >
                {placeholder}
              </div>
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No results found</div>
              ) : (
                filteredOptions.map(opt => {
                  const isSelected = opt.id === selectedId;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => selectOption(opt.id)}
                      className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/50 text-indigo-700 font-extrabold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.name}</span>
                      {isSelected && <Check size={14} weight="bold" className="text-indigo-600" />}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminBooksPage() {
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [genres, setGenres] = useState<GenreResponse[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookResponse | null>(null);

  // Submitting States
  const [submitting, setSubmitting] = useState(false);

  // Confirm delete Dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingBook, setDeletingBook] = useState<BookResponse | null>(null);

  // Inline Quick Add States
  const [quickAuthorOpen, setQuickAuthorOpen] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState('');
  const [quickPublisherOpen, setQuickPublisherOpen] = useState(false);
  const [newPublisherName, setNewPublisherName] = useState('');

  // Form Fields State
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<number[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [selectedPublisherId, setSelectedPublisherId] = useState<number | ''>('');
  const [publicationDate, setPublicationDate] = useState('');
  const [language, setLanguage] = useState('vi');
  const [pages, setPages] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [totalCopies, setTotalCopies] = useState<number>(5);
  const [availableCopies, setAvailableCopies] = useState<number>(5);
  const [price, setPrice] = useState<number>(0);
  const [loanFeePerDay, setLoanFeePerDay] = useState<number>(1000);
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const fetchMetadata = async () => {
    try {
      const [genresData, authorsData, publishersData] = await Promise.all([
        getGenres(),
        getAuthors(),
        getPublishers(),
      ]);
      setGenres(genresData || []);
      setAuthors(authorsData || []);
      setPublishers(publishersData || []);
    } catch (e) {
      toast.error('Error loading genres / authors / publishers');
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await getBooks({ page: 0, size: 100 });
      setBooks(data?.content || []);
    } catch (e) {
      toast.error('Error loading books list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchMetadata();
  }, []);

  const resetForm = () => {
    setIsbn('');
    setTitle('');
    setSelectedAuthorIds([]);
    setSelectedGenreIds([]);
    setSelectedPublisherId('');
    setPublicationDate('');
    setLanguage('vi');
    setPages('');
    setDescription('');
    setTotalCopies(5);
    setAvailableCopies(5);
    setPrice(0);
    setLoanFeePerDay(1000);
    setCoverImageUrl('');
    setSelectedBook(null);
  };

  const handleOpenAdd = () => {
    setIsEdit(false);
    resetForm();
    setFormOpen(true);
  };

  const handleOpenEdit = (book: BookResponse) => {
    setIsEdit(true);
    setSelectedBook(book);
    
    setIsbn(book.isbn || '');
    setTitle(book.title || '');
    setSelectedAuthorIds(book.authors?.map(a => a.id) || []);
    setSelectedGenreIds(book.genres?.map(g => g.id) || []);
    setSelectedPublisherId(book.publisher?.id || '');
    setPublicationDate(book.publicationDate ? book.publicationDate.split('T')[0] : '');
    setLanguage(book.language || 'vi');
    setPages(book.pages || '');
    setDescription(book.description || '');
    setTotalCopies(book.totalCopies);
    setAvailableCopies(book.availableCopies);
    setPrice(book.price || 0);
    setLoanFeePerDay(book.loanFeePerDay || 1000);
    setCoverImageUrl(book.coverImageUrl || '');
    
    setFormOpen(true);
  };

  const handleQuickAddAuthor = async () => {
    if (!newAuthorName.trim()) return;
    try {
      const newAuth = await createAuthor({ name: newAuthorName.trim() });
      setAuthors(prev => [...prev, newAuth]);
      setSelectedAuthorIds(prev => [...prev, newAuth.id]);
      setNewAuthorName('');
      setQuickAuthorOpen(false);
      toast.success('Author added successfully');
    } catch (e) {
      toast.error('Could not add author');
    }
  };

  const handleQuickAddPublisher = async () => {
    if (!newPublisherName.trim()) return;
    try {
      const newPub = await createPublisher({ name: newPublisherName.trim() });
      setPublishers(prev => [...prev, newPub]);
      setSelectedPublisherId(newPub.id);
      setNewPublisherName('');
      setQuickPublisherOpen(false);
      toast.success('Publisher added successfully');
    } catch (e) {
      toast.error('Could not add publisher');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isbn.trim() || !title.trim() || selectedAuthorIds.length === 0 || selectedGenreIds.length === 0 || !selectedPublisherId) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const payload = {
      isbn: isbn.trim(),
      title: title.trim(),
      authorIds: selectedAuthorIds,
      genreIds: selectedGenreIds,
      publisherId: Number(selectedPublisherId),
      publicationDate: publicationDate || undefined,
      language: language || 'vi',
      pages: pages ? Number(pages) : undefined,
      description: description.trim(),
      totalCopies: Number(totalCopies),
      availableCopies: Number(availableCopies),
      price: price,
      loanFeePerDay: loanFeePerDay,
      coverImageUrl: coverImageUrl.trim() || undefined,
      active: true
    };

    setSubmitting(true);
    try {
      if (isEdit && selectedBook) {
        await updateBook(selectedBook.id, payload);
        toast.success('Book updated successfully!');
      } else {
        await createBook(payload);
        toast.success('Book added successfully!');
      }
      setFormOpen(false);
      resetForm();
      fetchBooks();
    } catch (err: any) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (book: BookResponse) => {
    setDeletingBook(book);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBook) return;
    try {
      await deleteBook(deletingBook.id);
      toast.success('Book deleted successfully!');
      setBooks(prev => prev.filter(b => b.id !== deletingBook.id));
      setDeleteOpen(false);
      setDeletingBook(null);
    } catch (err: any) {
      toast.error(err.message || 'Could not delete book.');
    }
  };

  return (
    <AdminLayout pageTitle="Book Management">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        
        {/* Header section */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Books size={26} weight="fill" className="text-indigo-500" />
              Book Inventory
            </h1>
            <p className="text-sm text-slate-400 mt-1">Manage books, authors, and copies.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchBooks}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl cursor-pointer transition-colors"
              title="Refresh"
            >
              <ArrowClockwise size={16} />
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus size={16} weight="bold" /> Add New Book
            </button>
          </div>
        </div>

        {/* Books table list */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Book</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4 text-center">Available / Total</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <CircleNotch size={16} className="animate-spin text-indigo-500" />
                        Loading books catalog...
                      </div>
                    </td>
                  </tr>
                ) : (books || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No books found.</td>
                  </tr>
                ) : (
                  (books || []).map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 flex items-center gap-3">
                        <div className="w-10 h-14 bg-slate-100 rounded overflow-hidden shrink-0 shadow-sm border border-slate-100">
                          {book.coverImageUrl ? (
                            <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50"><Books size={18} className="text-slate-300" /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-800 text-[13px] truncate max-w-[280px]">{book.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{book.isbn}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-500 font-semibold">
                        {book.authors?.map((a: any) => a.name).join(', ') || 'Unknown'}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="font-extrabold text-indigo-600">{book.availableCopies}</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="font-semibold text-slate-500">{book.totalCopies}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(book)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <PencilSimple size={15} weight="bold" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(book)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash size={15} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Add/Edit Dialog ────────────────────────────────────────────────── */}
        <Dialog open={formOpen} onClose={() => !submitting && setFormOpen(false)} maxWidth="md" fullWidth
          slotProps={{ paper: { sx: { borderRadius: '24px', overflow: 'hidden' } } }}>
          <DialogContent sx={{ padding: 0 }}>
            <div className="relative">
              <IconButton onClick={() => setFormOpen(false)} disabled={submitting} size="small"
                sx={{ position: 'absolute', top: 12, right: 12 }}>
                <X size={16} />
              </IconButton>
              
              <div className="p-6 bg-slate-50 border-b border-slate-100">
                <h2 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                  <Books size={20} weight="fill" className="text-indigo-500" />
                  {isEdit ? 'Edit Book' : 'Add New Book'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Enter details for BookNest library catalog.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto">
                
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Book Title *</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Clean Code"
                    className="h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300" />
                </div>

                {/* ISBN */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">ISBN Code *</label>
                  <input type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)} required placeholder="e.g. 978-0-13-235088-4"
                    className="h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300" />
                </div>

                {/* Authors (Multi) */}
                <MultiSelectDropdown
                  label="Authors *"
                  options={authors}
                  selectedIds={selectedAuthorIds}
                  onChange={setSelectedAuthorIds}
                  placeholder="Select authors..."
                  quickAddNode={
                     <div className="relative">
                       <button type="button" onClick={() => setQuickAuthorOpen(!quickAuthorOpen)}
                         className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer">
                         + Add new author
                       </button>
                       {quickAuthorOpen && (
                         <div className="absolute right-0 top-5 z-[100] w-64 p-3 bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col gap-2">
                           <p className="text-[10px] font-bold text-slate-500 uppercase">Add New Author</p>
                           <input type="text" value={newAuthorName} onChange={(e) => setNewAuthorName(e.target.value)} placeholder="Author name..."
                             className="h-8 px-2 text-[11px] border border-slate-200 rounded-xl outline-none" />
                           <div className="flex gap-2 justify-end">
                             <button type="button" onClick={() => setQuickAuthorOpen(false)} className="h-7 px-2.5 border border-slate-200 text-slate-500 font-bold text-[10px] rounded-lg">Cancel</button>
                             <button type="button" onClick={handleQuickAddAuthor} className="h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg">Save</button>
                           </div>
                         </div>
                       )}
                     </div>
                  }
                />

                {/* Genres (Multi) */}
                <MultiSelectDropdown
                  label="Genres *"
                  options={genres}
                  selectedIds={selectedGenreIds}
                  onChange={setSelectedGenreIds}
                  placeholder="Select genres..."
                />

                {/* Publisher */}
                <SingleSelectDropdown
                  label="Publisher *"
                  options={publishers}
                  selectedId={selectedPublisherId}
                  onChange={setSelectedPublisherId}
                  placeholder="Select publisher..."
                  quickAddNode={
                    <div className="relative">
                      <button type="button" onClick={() => setQuickPublisherOpen(!quickPublisherOpen)}
                        className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer">
                        + Add new publisher
                      </button>
                      {quickPublisherOpen && (
                        <div className="absolute right-0 top-5 z-[100] w-64 p-3 bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col gap-2">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Add New Publisher</p>
                          <input type="text" value={newPublisherName} onChange={(e) => setNewPublisherName(e.target.value)} placeholder="Publisher name..."
                            className="h-8 px-2 text-[11px] border border-slate-200 rounded-xl outline-none" />
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setQuickPublisherOpen(false)} className="h-7 px-2.5 border border-slate-200 text-slate-500 font-bold text-[10px] rounded-lg">Cancel</button>
                            <button type="button" onClick={handleQuickAddPublisher} className="h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg">Save</button>
                          </div>
                        </div>
                      )}
                    </div>
                  }
                />

                {/* Publication Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Publication Date</label>
                  <input type="date" value={publicationDate} onChange={(e) => setPublicationDate(e.target.value)}
                    className="h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-400" />
                </div>

                {/* Language & Pages */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Language</label>
                    <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="vi"
                      className="h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pages</label>
                    <input type="number" value={pages} onChange={(e) => setPages(e.target.value ? Number(e.target.value) : '')} placeholder="350"
                      className="h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-400" />
                  </div>
                </div>

                {/* Cover Image URL */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Cover Image (URL)</label>
                  <input type="url" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..."
                    className="h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-400" />
                </div>

                {/* Copies configuration */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Copies *</label>
                    <input type="number" value={totalCopies} onChange={(e) => setTotalCopies(Number(e.target.value))} required min={1}
                      className="h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Available Copies *</label>
                    <input type="number" value={availableCopies} onChange={(e) => setAvailableCopies(Number(e.target.value))} required min={0}
                      className="h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-400" />
                  </div>
                </div>

                {/* Fees configuration */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Book Price (VND)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0}
                      className="h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Daily Loan Fee (VND) *</label>
                    <input type="number" value={loanFeePerDay} onChange={(e) => setLoanFeePerDay(Number(e.target.value))} required min={0}
                      className="h-10 px-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-400" />
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Detailed Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Summary of book content..."
                    className="h-24 p-3 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-400 resize-none" />
                </div>

                {/* Submit button */}
                <div className="md:col-span-2 border-t border-slate-100 pt-5 flex gap-3 justify-end">
                  <button type="button" onClick={() => setFormOpen(false)} disabled={submitting}
                    className="h-10 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow shadow-indigo-100">
                    {submitting ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} weight="bold" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth
          slotProps={{ paper: { sx: { borderRadius: '20px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' } } }}>
          <DialogContent sx={{ padding: 0 }}>
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                  <Trash size={28} weight="fill" className="text-rose-500" />
                </div>
              </div>
              <h2 className="text-center text-sm font-black text-slate-800 mb-2">Confirm Book Delete</h2>
              <p className="text-center text-xs text-slate-400 leading-relaxed">
                Are you sure you want to delete the book <strong className="text-slate-700">{deletingBook?.title}</strong> from the library? Copies and related history will be hidden.
              </p>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setDeleteOpen(false)}
                  className="flex-1 h-10 rounded-xl border-2 border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer">
                  Cancel
                </button>
                <button type="button" onClick={handleDeleteConfirm}
                  className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer">
                  Confirm Delete
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
}
