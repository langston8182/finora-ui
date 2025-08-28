// src/pages/ExpenseEntry.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
  FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { useBudgetStore } from '../store/budget';
import { useToast } from '../components/ui/use-toast';
import { Loading } from '../components/ui/loading';
import { parseCurrency } from '../lib/utils';

/**
 * Types locaux (adapte si tu as déjà des types globaux)
 */
type ExpenseDraft = {
  id: string;
  dateISO: string;
  label: string;
  amount: number; // en euros ici (le back/logic peut convertir en centimes)
  categoryId: string;
};

const SUGGESTION_POOL = [
  // Courses & alimentation
  "U Express",
  "Leclerc",
  "Action",
  "Lidl",
  "Carrefour",
  "Aldi",
  "Grand Frais",
  "Biocoop",
  "Picard",
  "Cigarettes",

  // Restaurants / fast-food
  "KFC",
  "McDonald’s",
  "Burger King",
  "Subway",
  "Domino’s Pizza",
  "Pizza Hut",
  "Restaurant",

  // Énergie / logement
  "EDF",
  "Engie",
  "TotalEnergies",
  "Eau de Bordeaux Métropole",
  "Saur",
  "Veolia Eau",

  // Télécom / Internet
  "Orange",
  "SFR",
  "Bouygues Telecom",
  "Free",
  "Red by SFR",

  // Abonnements / loisirs
  "Netflix",
  "Prime Video",
  "Disney+",
  "Spotify",
  "Deezer",
  "Apple Music",
  "Canal+",

  // Santé / pharmacie
  "Pharmacie",
  "Opticien",
  "Dentiste",
  "Docteur",
  "Mutuelle",

  // Transports / voiture
  "SNCF",
  "BlaBlaCar",
  "Uber",
  "Essence - Total",
  "Essence - Esso",
  "Essence - Shell",
  "Norauto",
  "Feu Vert",
  "Péage",
  "Pièces auto",

  // Shopping
  "Amazon",
  "Cdiscount",
  "Fnac",
  "Darty",
  "Decathlon",
  "Ikea",
  "Zara",
  "H&M",

  // Assurances / banques
  "MAIF",
  "AXA",
  "Crédit Agricole",
  "Banque Populaire",
  "CIC",
  "Boursorama",
  "Hello Bank",
  "Revolut",

  // Impôts & charges
  "Impôts",
  "URSSAF",
  "CAF",
  "Sécurité sociale",
  "Taxe foncière",
  "Taxe d’habitation",

  // Divers & imprévus
  "Cadeaux",
  "Vacances",
  "Loisirs",
  "Salle de sport",
  "École",
  "Cantine",
  "Animaux"
];

const currency = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Clé localStorage pour mémoriser le dernier mapping libellé→catégorie,
 * afin de pré-sélectionner la catégorie lors des prochaines saisies.
 */
const LS_LABEL_TO_CAT = "budget.labelToCategory";

/**
 * Charge / sauve le mapping libellé→catégorie
 */
function loadLabelToCategory(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_LABEL_TO_CAT);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveLabelToCategory(map: Record<string, string>) {
  try {
    localStorage.setItem(LS_LABEL_TO_CAT, JSON.stringify(map));
  } catch {
    // no-op
  }
}

/**
 * Composants UI minimaux (si tu as un kit, remplace par tes composants)
 */
const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
> = ({ label, className, ...props }) => (
  <div>
    {label && (
      <label className="block text-sm text-slate-600 mb-1">{label}</label>
    )}
    <input
      {...props}
      className={
        "w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400 " +
        (className || "")
      }
    />
  </div>
);

const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }
> = ({ label, children, className, ...props }) => (
  <div>
    {label && (
      <label className="block text-sm text-slate-600 mb-1">{label}</label>
    )}
    <select
      {...props}
      className={
        "w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400 bg-white appearance-none cursor-pointer hover:border-slate-400 transition-colors " +
        (className || "")
      }
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.5rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.5em 1.5em',
        paddingRight: '2.5rem'
      }}
    >
      {children}
    </select>
  </div>
);

const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "danger";
  }
> = ({ children, variant = "primary", className, ...props }) => {
  const base =
    "rounded-xl px-4 py-2 font-medium transition active:scale-[0.99] ";
  const style =
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-700"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "hover:bg-slate-100";
  return (
    <button {...props} className={base + style + (className ? " " + className : "")}>
      {children}
    </button>
  );
};

const Card: React.FC<{ title?: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="rounded-2xl bg-white shadow p-4 border border-slate-200">
    {title && (
      <h3 className="text-slate-700 text-sm font-medium mb-2">{title}</h3>
    )}
    <div>{children}</div>
  </div>
);

/**
 * Page Saisie Dépense
 */
const ExpenseEntry: React.FC = () => {
  const navigate = useNavigate();
  const { 
    categories, 
    addExpense, 
    loadCategories, 
    getExpenseLabels,
    loading,
    error,
    apiFailure
  } = useBudgetStore();
  const { toast } = useToast();

  // État formulaire
  const [date, setDate] = useState<string>(todayISO());
  const [label, setLabel] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Suggestions
  const [openSuggest, setOpenSuggest] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1); // navigation clavier

  // Ref du conteneur pour capter les clics extérieurs
  const labelBoxRef = useRef<HTMLDivElement | null>(null);

  // Mapping libellé → dernière catégorie utilisée
  const [labelToCategory, setLabelToCategory] = useState<Record<string, string>>(
    () => loadLabelToCategory()
  );
  
  // Load categories on mount
  useEffect(() => {
    if (apiFailure) {
      console.log('API marked as failed, skipping categories load');
      toast({
        title: 'Mode hors ligne',
        description: 'Impossible de charger les catégories. Fonctionnalité limitée.',
        variant: 'destructive',
      });
      return;
    }
    
    const loadData = async () => {
      try {
        await loadCategories();
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadData();
  }, [loadCategories, apiFailure, toast]);
  
  // Set default category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  // Debug: log categories to see if they're loaded
  console.log('Categories in ExpenseEntry:', categories);

  // Suggestions filtrées
  const suggestions = useMemo(() => {
    const value = label.trim().toLowerCase();
    const expenseLabels = getExpenseLabels();
    const pool = [...expenseLabels, ...SUGGESTION_POOL];
    if (!value) return pool.slice(0, 6);
    return pool
      .filter((x) => x.toLowerCase().includes(value))
      .slice(0, 8);
  }, [label]);

  // Ouvre les suggestions quand on tape, les ferme si champ vide blur etc.
  useEffect(() => {
    if (label.trim().length > 0) setOpenSuggest(true);
    else setOpenSuggest(false);
    setActiveIndex(-1);
  }, [label]);

  // Fermer au clic extérieur + Escape
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!labelBoxRef.current) return;
      if (!labelBoxRef.current.contains(e.target as Node)) {
        setOpenSuggest(false);
        setActiveIndex(-1);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenSuggest(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown as any);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown as any);
    };
  }, []);

  // Pré-sélection catégorie si connue pour ce libellé
  useEffect(() => {
    const key = label.trim().toLowerCase();
    if (!key) return;
    const known = labelToCategory[key];
    if (known && categories.some((c) => c.id === known)) {
      setCategoryId(known);
    }
  }, [label, labelToCategory, categories]);

  // Navigation clavier dans les suggestions
  const onLabelKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!openSuggest || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        setLabel(suggestions[activeIndex]);
        setOpenSuggest(false);
      }
    }
  };

  // Soumission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const a = Number(amount);
    if (!label.trim() || !a || a <= 0) return;

    const expenseData = {
      date: date,
      label: label.trim(),
      amountCts: parseCurrency(amount),
      categoryId,
    };

    try {
      setSubmitting(true);
      await addExpense(expenseData);
      
      // Mémoriser le mapping label→catégorie
      const key = expenseData.label.toLowerCase();
      const updated = { ...labelToCategory, [key]: categoryId };
      setLabelToCategory(updated);
      saveLabelToCategory(updated);
      
      toast({
        title: 'Dépense ajoutée',
        description: `${expenseData.label} - ${currency(a)}`,
      });
      
      // Redirige vers la chronologie après enregistrement
      setTimeout(() => {
        navigate("/timeline");
      }, 100);
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la dépense',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Sécurité UX: ferme le dropdown avant de quitter
    setOpenSuggest(false);
    setActiveIndex(-1);
    navigate("/forecast");
  };

  if (loading && categories.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-center py-12">
          <Loading size="lg" text="Chargement..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Erreur: {error}</p>
        </div>
      )}
      
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Saisir une dépense</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleCancel}>
            Retour
          </Button>
        </div>
      </div>

      <form
        className="grid lg:grid-cols-3 gap-4"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <div className="lg:col-span-3">
          <Card title="Nouvelle dépense">
          <div className="space-y-3">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            {/* Libellé + suggestions */}
            <div className="relative" ref={labelBoxRef}>
              <Input
                label="Libellé *"
                placeholder="ex. Leclerc"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={onLabelKeyDown}
                onFocus={() => label.trim() && setOpenSuggest(true)}
                aria-autocomplete="list"
                aria-expanded={openSuggest}
                aria-controls="expense-suggest"
                aria-activedescendant={
                  activeIndex >= 0 ? `suggest-${activeIndex}` : undefined
                }
              />

              {openSuggest && suggestions.length > 0 && (
                <div
                  id="expense-suggest"
                  className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto"
                  // évite que le clic dans la liste soit intercepté par le handler global
                  onMouseDown={(e) => e.stopPropagation()}
                  role="listbox"
                >
                  {suggestions.map((s, idx) => (
                    <button
                      key={s}
                      id={`suggest-${idx}`}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm ${
                        idx === activeIndex ? "bg-indigo-50" : "hover:bg-slate-50"
                      }`}
                      onClick={() => {
                        setLabel(s);
                        setOpenSuggest(false);
                        setActiveIndex(-1);
                      }}
                      role="option"
                      aria-selected={idx === activeIndex}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Input
              label={`Montant (€) ${amount ? `— ${currency(Number(amount) || 0)}` : ""}`}
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
             lang="fr-FR"
            />

            <Select
              label="Catégorie"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <div className="pt-2 flex items-center gap-2">
              <Button type="submit" disabled={submitting || loading}>
                {submitting ? <Loading size="sm" /> : 'Enregistrer'}
              </Button>
              <Button variant="ghost" type="button" onClick={handleCancel}>
                Annuler
              </Button>
            </div>
          </div>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default ExpenseEntry;
export { ExpenseEntry };