import { useState, useEffect, useCallback } from "react";
import { CheckCircle, X } from "lucide-react";

const FIRST_NAMES = [
  "Maria", "Juan", "Ana", "Pedro", "Lisa", "Carlo", "Jenny", "Mark",
  "Rosa", "Kevin", "Angela", "Dennis", "Catherine", "Ramon", "Michelle",
  "Grace", "Joey", "Lorna", "Paolo", "Tina", "Ricky", "Maricel", "Allan",
  "Diana", "Edwin", "Cristina", "Rodel", "Shiela", "Jun", "Karen", "Nico",
  "Aileen", "Raffy", "Gina", "Tomas", "Vicky", "Erwin", "Marlon", "Brenda",
  "Mario", "Luzviminda", "Rogelio", "Nenita", "Eduardo", "Fe", "Felipe",
  "Gregorio", "Caridad", "Isidro", "Purificacion", "Teodoro", "Visitacion",
  "Maximo", "Consuelo", "Efren", "Salvacion", "Federico", "Milagros",
  "Alberto", "Rosario", "Crispin", "Apolonia", "Dionisio", "Leticia",
  "Herminio", "Corazon", "Norberto", "Remedios", "Rufino", "Aurora",
  "Simeon", "Perlita", "Teofilo", "Rosalinda", "Anacleto", "Gloria",
  "Ponciano", "Natividad", "Rodolfo", "Elena", "Benjamin", "Teresita",
  "Luis", "Josefina", "Antonio", "Adelaida", "Manuel", "Oscar", "Lourdes",
  "Reynaldo", "Esperanza", "Danilo", "Nieves", "Rolando", "Ligaya",
  "Armando", "Merlinda", "Renato", "Edgardo", "Salud", "Ramoncito",
  "Lilian", "Ruben", "Cecilia", "Lydia", "Nestor", "Eddie", "Lolita",
  "Romy", "Ernesto", "Ricardo", "Roderick",
];

const LAST_NAMES = [
  "Santos", "Dela Cruz", "Gonzales", "Reyes", "Mercado", "Villanueva",
  "Lopez", "Fernandez", "Bautista", "Ramos", "Castillo", "Garcia",
  "Mendoza", "Torres", "Aquino", "Rivera", "Navarro", "Cruz", "Santiago",
  "Dimagiba", "Alvarez", "Dominguez", "Perez", "Flores", "Villar",
  "Ignacio", "Manalo", "Delos Santos", "Tolentino",
];

const LOCATIONS = [
  "Bulacan", "Manila", "Quezon City", "Cebu City", "Davao City",
  "Cavite", "Laguna", "Pampanga", "Batangas", "Rizal", "Nueva Ecija",
  "Tarlac", "Pangasinan", "Ilocos Norte", "Ilocos Sur", "La Union",
  "Baguio", "Zambales", "Bataan", "Mindoro", "Palawan", "Iloilo City",
  "Bacolod", "Cagayan de Oro", "General Santos", "Zamboanga City",
  "Butuan", "Tacloban", "Legazpi", "Naga", "Lucena", "Olongapo",
  "Angeles City", "San Fernando", "Malolos", "Meycauayan",
  "San Jose del Monte", "Santa Maria", "Marilao", "Plaridel",
];

const ACTIONS = [
  "signed up for Pro",
  "signed up for Pro+",
  "signed up for VIP",
  "signed up for GCash Management System",
  "signed up for Business Management System",
  "signed up for Product Image Bundle",
  "signed up for UGC Ads Video",
  "signed up for Cinematic Ads Video",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function LiveNotification() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [action, setAction] = useState("");
  const showNext = useCallback(() => {
    setName(`${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`);
    setLocation(pick(LOCATIONS));
    setAction(pick(ACTIONS));
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => {
      showNext();
    }, 5000);
    return () => clearTimeout(initial);
  }, [showNext]);

  useEffect(() => {
    if (!visible) return;
    const hide = setTimeout(() => {
      setVisible(false);
    }, 6000);
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
              {action}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Verified. Just now</p>
          </div>
        </div>
      </div>
    </div>
  );
}
