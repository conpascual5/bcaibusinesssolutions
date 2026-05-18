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
  "Manny Pacquiao",
  "Sarah Geronimo",
  "Vice Ganda",
  "Kathryn Bernardo",
  "Daniel Padilla",
  "Alden Richards",
  "Maine Mendoza",
  "Coco Martin",
  "Julia Montes",
  "Enrique Gil",
  "Liza Soberano",
  "Piolo Pascual",
  "Bea Alonzo",
  "John Lloyd Cruz",
  "Angel Locsin",
  "Jericho Rosales",
  "Kim Chiu",
  "Xian Lim",
  "Nadine Lustre",
  "James Reid",
  "Donny Pangilinan",
  "Belle Mariano",
  "Joshua Garcia",
  "Julia Barretto",
  "Rico Blanco",
  "Kris Aquino",
  "Sharon Cuneta",
  "Vilma Santos",
  "Nora Aunor",
  "Robin Padilla",
  "Bong Revilla",
  "Dolphy Quizon",
  "Tito Sotto",
  "Vic Sotto",
  "Joey de Leon",
  "Willie Revillame",
  "Boy Abunda",
  "Toni Gonzaga",
  "Bianca Gonzalez",
  "Megan Young",
  "Pia Wurtzbach",
  "Catriona Gray",
  "Marian Rivera",
  "Dingdong Dantes",
  "Heart Evangelista",
  "Richard Gomez",
  "Gabby Concepcion",
  "Ruffa Gutierrez",
  "Jolina Magdangal",
  "Regine Velasquez",
  "Ogie Alcasid",
  "Gary Valenciano",
  "Martin Nievera",
  "Lea Salonga",
  "Richard Gutierrez",
  "Derek Ramsay",
  "Carla Abellana",
  "Kylie Padilla",
  "Aljur Abrenica",
  "Sanya Lopez",
  "Gabbi Garcia",
  "Ken Chan",
  "Miguel Tanfelix",
  "Bianca Umali",
  "David Licauco",
  "Barbie Forteza",
  "Julie Anne San Jose",
  "Rayver Cruz",
  "Janine Gutierrez",
  "Paulo Avelino",
  "KC Concepcion",
  "Jake Cuenca",
  "Shaina Magdayao",
  "Diether Ocampo",
  "Claudine Barretto",
  "Marvin Agustin",
  "Rico Yan",
  "Judy Ann Santos",
  "Ryan Agoncillo",
  "Angelica Panganiban",
  "Arci Muñoz",
  "Sam Milby",
  "Yeng Constantino",
  "Erik Santos",
  "Christian Bautista",
  "Bamboo Mañalac",
  "Ely Buendia",
  "Karla Estrada",
  "Jaya",
  "Kyla",
  "Nina",
  "Jay R",
  "Luke Mejares",
  "Cookie Chua",
  "Barbie Almalbis",
  "Kitchie Nadal",
  "Rachel Alejandro",
  "Hajji Alejandro",
  "Jessica Soho",
  "Kara David",
  "Atom Araullo",
  "Howie Severino",
  "Raffy Tima",
  "Maki Pulido",
  "Jiggy Manicad",
  "Bernadette Sembrano",
  "Anthony Taberna",
  "Ted Failon",
  "Korina Sanchez",
  "Noli de Castro",
  "Erwin Tulfo",
  "Raffy Tulfo",
  "Ben Tulfo",
  "Mon Tulfo",
  "Bong Go",
  "Manny Villar",
  "Cynthia Villar",
  "Loren Legarda",
  "Grace Poe",
  "Kiko Pangilinan",
  "Bam Aquino",
  "Risa Hontiveros",
  "Alan Peter Cayetano",
  "Pia Cayetano",
  "Sonny Angara",
  "Nancy Binay",
  "JV Ejercito",
  "Bato Dela Rosa",
  "Bongbong Marcos",
  "Leni Robredo",
  "Isko Moreno",
  "Vico Sotto",
  "Joy Belmonte",
  "Rex Gatchalian",
  "Sherwin Gatchalian",
  "Francis Zamora",
  "Junjun Binay",
  "Abby Binay",
  "Lito Atienza",
  "Erap Estrada",
  "Jejomar Binay",
  "Fidel V. Ramos",
  "Corazon Aquino",
  "Benigno Aquino III",
  "Gloria Macapagal Arroyo",
  "Rodrigo Duterte",
  "Sara Duterte",
  "Paolo Duterte",
  "Sebastian Duterte",
  "Leila De Lima",
  "Antonio Trillanes",
  "Gary Alejano",
  "Nur Misuari",
  "Murad Ebrahim",
  "Salamat Hashim",
  "Manny Piñol",
  "Jinkee Pacquiao",
  "Matteo Guidicelli",
  "Ion Perez",
  "Bimby Aquino Yap",
  "James Yap",
  "Josh Aquino",
  "James Carlos Yap",
  "Joshua Philip Yap",
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
    setName(pick(NAMES));
    setLocation(pick(LOCATIONS));
    setAction(pick(ACTIONS));
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
              {action}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Verified. Just now</p>
          </div>
        </div>
      </div>
    </div>
  );
}
