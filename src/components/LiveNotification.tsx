import { useState, useEffect, useCallback } from "react";
import { CheckCircle, X } from "lucide-react";

const NAMES = [
  "Maria Santos",
  "Juan Dela Cruz",
  "Ana Gonzales",
  "Pedro Reyes",
  "Lisa Mercado",
  "Carlo Villanueva",
  "Jenny Lopez",
  "Mark Fernandez",
  "Rosa Bautista",
  "Kevin Ramos",
  "Angela Castillo",
  "Dennis Garcia",
  "Catherine Mendoza",
  "Ramon Torres",
  "Michelle Aquino",
  "Bong Rivera",
  "Grace Navarro",
  "Joey Cruz",
  "Lorna Santiago",
  "Paolo Dimagiba",
  "Tina Alvarez",
  "Ricky Dominguez",
  "Maricel Santos",
  "Allan Perez",
  "Diana Flores",
  "Edwin Gonzales",
  "Cristina Villar",
  "Rodel Ignacio",
  "Shiela Manalo",
  "Jun Bautista",
  "Karen Delos Santos",
  "Nico Reyes",
  "Aileen Mercado",
  "Raffy Tolentino",
  "Gina Fernandez",
  "Tomas Rivera",
  "Vicky Cruz",
  "Erwin Lopez",
  "Marlon Castillo",
  "Brenda Ramos",
];

const LOCATIONS = [
  "Bulacan",
  "Manila",
  "Quezon City",
  "Cebu City",
  "Davao City",
  "Cavite",
  "Laguna",
  "Pampanga",
  "Batangas",
  "Rizal",
  "Nueva Ecija",
  "Tarlac",
  "Pangasinan",
  "Ilocos Norte",
  "Ilocos Sur",
  "La Union",
  "Baguio",
  "Zambales",
  "Bataan",
  "Mindoro",
  "Palawan",
  "Iloilo City",
  "Bacolod",
  "Cagayan de Oro",
  "General Santos",
  "Zamboanga City",
  "Butuan",
  "Tacloban",
  "Legazpi",
  "Naga",
  "Lucena",
  "Olongapo",
  "Angeles City",
  "San Fernando",
  "Malolos",
  "Meycauayan",
  "San Jose del Monte",
  "Santa Maria",
  "Marilao",
  "Plaridel",
];

const ACTION = "just secured a slot";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function LiveNotification() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const showNext = useCallback(() => {
    setName(pick(NAMES));
    setLocation(pick(LOCATIONS));
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
  }, []);

  useEffect(() => {
    // Show first notification after 5 seconds
    const initial = setTimeout(() => {
      showNext();
    }, 5000);

    return () => clearTimeout(initial);
  }, [showNext]);

  useEffect(() => {
    if (!visible) return;

    // Auto-hide after 6 seconds
    const hide = setTimeout(() => {
      setVisible(false);
    }, 6000);

    // Show next notification after 12-25 seconds
    const next = setTimeout(() => {
      showNext();
    }, 12000 + Math.random() * 13000);

    return () => {
      clearTimeout(hide);
      clearTimeout(next);
    };
  }, [visible, showNext]);

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-[100] transition-all duration-500 ease-in-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 pr-12 max-w-xs relative">
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500">
              <span className="font-medium text-emerald-600">{location}</span>{" "}
              {ACTION}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Verified. Just now</p>
          </div>
        </div>
      </div>
    </div>
  );
}
