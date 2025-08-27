// src/pages/IncomeEntry.tsx
import React, { FormEvent, useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBudgetStore } from '../store/budget';
import { useToast } from '../components/ui/use-toast';
import { Loading } from '../components/ui/loading';
import { parseCurrency } from '../lib/utils';

const currency = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const todayISO = () => new Date().toISOString().slice(0, 10);

const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
> = ({ label, className, ...props }) => (
  <div>
    {label && <label className="block text-sm text-slate-600 mb-1">{label}</label>}
    <input
      {...props}
      className={
        "w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400 " +
        (className || "")
      }
    />
  </div>
);

const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "danger";
  }
> = ({ children, variant = "primary", className, ...props }) => {
  const base = "rounded-xl px-4 py-2 font-medium transition active:scale-[0.99] ";
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

const Card: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-2xl bg-white shadow p-4 border border-slate-200">
    {title && <h3 className="text-slate-700 text-sm font-medium mb-2">{title}</h3>}
    <div>{children}</div>
  </div>
);

type IncomeDraft = {
  id: string;
  dateISO: string;
  label: string;
  amount: number; // euros (convertis en centimes côté logique/API si besoin)
  notes?: string;
};

const IncomeEntry: React.FC = () => {
  const navigate = useNavigate();
  const { addIncome, loading } = useBudgetStore();
  const { toast } = useToast();

  const [date, setDate] = useState<string>(todayISO());
  const [label, setLabel] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const a = Number(amount);
    if (!label.trim() || !a || a <= 0) return;

    const incomeData = {
      date: date,
      label: label.trim(),
      amountCts: parseCurrency(amount),
    };

    try {
      setSubmitting(true);
      await addIncome(incomeData);
      
      toast({
        title: 'Recette ajoutée',
        description: `${incomeData.label} - ${currency(a)}`,
      });
      
      // Redirige vers la chronologie après enregistrement
      navigate("/timeline");
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la recette',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Saisir une recette ponctuelle</h1>
        <Button variant="ghost" onClick={handleCancel}>Retour</Button>
      </div>

      <form className="grid lg:grid-cols-3 gap-4" onSubmit={handleSubmit} autoComplete="off">
        <div className="lg:col-span-3">
          <Card title="Nouvelle recette">
          <div className="space-y-3">
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayISO()} />
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input label="Libellé *" placeholder="ex. Remboursement" value={label} onChange={(e) => setLabel(e.target.value)} />
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
            <div className="pt-2 flex items-center gap-2">
              <Button type="submit" disabled={submitting || loading}>
                {submitting ? <Loading size="sm" /> : 'Enregistrer'}
              </Button>
              <Button variant="ghost" type="button" onClick={handleCancel}>Annuler</Button>
            </div>
          </div>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default IncomeEntry;
export { IncomeEntry };