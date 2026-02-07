import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button';
import { Card } from '../components/Card';
import { ConfirmModal } from '../components/Modal';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Table, THead, TBody, TR, TH, TD } from '../components/Table';
import { Input } from '../components/Input';
import { useToast } from '../components/Toast';
import type { FAQ, FAQCategory } from '../services/api';
import * as api from '../services/api';

export default function FAQAdminPage() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySortOrder, setCategorySortOrder] = useState(0);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [showDeleteFaqConfirm, setShowDeleteFaqConfirm] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<{ id: number; question: string } | null>(null);
  const [showDeleteCatConfirm, setShowDeleteCatConfirm] = useState(false);
  const [catToDelete, setCatToDelete] = useState<{ id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, list] = await Promise.all([api.getFAQCategories(), api.getFAQs()]);
      setCategories(cats);
      setFaqs(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategorySortOrder(categories.length);
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat: FAQCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategorySortOrder(cat.sort_order ?? 0);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategorySubmitting(true);
    try {
      if (editingCategory) {
        await api.updateFAQCategory(editingCategory.id, {
          name: categoryName.trim(),
          sort_order: categorySortOrder,
        });
        toast.success('Category updated');
      } else {
        await api.createFAQCategory({
          name: categoryName.trim(),
          sort_order: categorySortOrder,
        });
        toast.success('Category created');
      }
      setShowCategoryModal(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeleteFaq = async () => {
    if (!faqToDelete) return;
    setDeleteLoading(true);
    try {
      await api.deleteFAQ(faqToDelete.id);
      toast.success('FAQ deleted');
      setShowDeleteFaqConfirm(false);
      setFaqToDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!catToDelete) return;
    setDeleteLoading(true);
    try {
      await api.deleteFAQCategory(catToDelete.id);
      toast.success('Category deleted');
      setShowDeleteCatConfirm(false);
      setCatToDelete(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getCategoryName = (id: number | undefined) => {
    if (!id) return '—';
    return categories.find((c) => c.id === id)?.name ?? '—';
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage FAQ"
        subtitle="Create and manage FAQs and categories"
        actions={
          <div className="flex gap-2">
            <ButtonLink to="/faq" variant="ghost">
              View FAQ
            </ButtonLink>
            <Button variant="secondary" onClick={openAddCategory}>
              Add Category
            </Button>
            <ButtonLink to="/faq/new">Add FAQ</ButtonLink>
          </div>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : (
        <>
          {/* Categories Section */}
          <Card>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#0f172a]">Categories</h2>
              <p className="text-sm text-slate-500 mt-0.5">Organize FAQs into categories</p>
            </div>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Sort Order</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {categories.length === 0 ? (
                  <TR>
                    <TD colSpan={3} className="py-8 text-center text-slate-400">
                      No categories yet. Add one to get started.
                    </TD>
                  </TR>
                ) : (
                  categories.map((c) => (
                    <TR key={c.id}>
                      <TD className="font-bold text-[#0f172a]">{c.name}</TD>
                      <TD>{c.sort_order ?? 0}</TD>
                      <TD className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditCategory(c)}
                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setCatToDelete({ id: c.id, name: c.name });
                              setShowDeleteCatConfirm(true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </Card>

          {/* FAQs Section */}
          <Card>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#0f172a]">FAQs</h2>
              <p className="text-sm text-slate-500 mt-0.5">Frequently asked questions</p>
            </div>
            <Table>
              <THead>
                <TR>
                  <TH>Question</TH>
                  <TH>Category</TH>
                  <TH>Sort</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {faqs.length === 0 ? (
                  <TR>
                    <TD colSpan={4} className="py-8 text-center text-slate-400">
                      No FAQs yet. Add one to get started.
                    </TD>
                  </TR>
                ) : (
                  faqs.map((f) => (
                    <TR key={f.id}>
                      <TD className="font-bold text-[#0f172a] max-w-md truncate">{f.question}</TD>
                      <TD>{getCategoryName(f.category_id)}</TD>
                      <TD>{f.sort_order ?? 0}</TD>
                      <TD className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/faq/${f.id}/edit`}
                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => {
                              setFaqToDelete({ id: f.id, question: f.question });
                              setShowDeleteFaqConfirm(true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </Card>
        </>
      )}

      {/* Category Form Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCategoryModal(false)} type="button">
              Cancel
            </Button>
            <Button form="category-form" type="submit" disabled={categorySubmitting}>
              {categorySubmitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
            placeholder="e.g. Leave & Attendance"
          />
          <Input
            label="Sort Order"
            type="number"
            value={categorySortOrder}
            onChange={(e) => setCategorySortOrder(parseInt(e.target.value, 10) || 0)}
            min={0}
          />
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteFaqConfirm}
        onClose={() => {
          setShowDeleteFaqConfirm(false);
          setFaqToDelete(null);
        }}
        onConfirm={handleDeleteFaq}
        title="Delete FAQ"
        confirmText="Yes, Delete"
        variant="danger"
        isLoading={deleteLoading}
      >
        <p>
          Are you sure you want to delete this FAQ? <span className="font-bold text-brand-dark block mt-2 truncate max-w-md">{faqToDelete?.question}</span>
        </p>
        <p className="mt-2 text-sm text-red-500 font-medium">This action cannot be undone.</p>
      </ConfirmModal>

      <ConfirmModal
        isOpen={showDeleteCatConfirm}
        onClose={() => {
          setShowDeleteCatConfirm(false);
          setCatToDelete(null);
        }}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        confirmText="Yes, Delete"
        variant="danger"
        isLoading={deleteLoading}
      >
        <p>
          Are you sure you want to delete the category <span className="font-bold text-brand-dark">{catToDelete?.name}</span>?
        </p>
        <p className="mt-2 text-sm text-slate-500">FAQs in this category will not be deleted, but will have no category.</p>
        <p className="mt-1 text-sm text-red-500 font-medium">This action cannot be undone.</p>
      </ConfirmModal>
    </div>
  );
}
