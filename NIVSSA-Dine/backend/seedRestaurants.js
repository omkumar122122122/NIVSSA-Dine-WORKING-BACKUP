const mongoose = require("mongoose");
require("dotenv").config();

const Restaurant = require("./models/Restaurant");
const Table = require("./models/Table");

const restaurants = [
  {
    name: "The Royal Crown",
    phone: "8240690093",
    email: "royalcrown17@gmail.com",
    address: "Salt Lake Sector 5",
    openingTime: "12:00 PM",
    closingTime: "2:00 AM",
    openDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    closedDays: [],
    seatingOptions: [
      "indoor",
      "outdoor",
      "window",
      "private",
    ],
    cuisine: ["North Indian", "Mughlai", "Indian"],
    priceForTwo: 1500,
    totalTables: 25,
    maximumCapacity: 100,
    averageTurnTime: 90,
    specialInfo: [
      "Live Music",
      "Private Dining Area",
      "Valet Parking",
      "Premium Customer Service",
    ],
    menu: {
      starters: [
        {
          name: "Murgh Malai Tikka",
          price: 380,
          description:
            "Tender chicken pieces marinated in rich cream, cashew paste, and royal spices.",
        },
        {
          name: "Shahi Paneer Tikka",
          price: 320,
          description:
            "Fresh cottage cheese cubes marinated in yogurt and grilled to perfection in a tandoor.",
        },
        {
          name: "Lucknowi Galouti Kebab",
          price: 450,
          description:
            "Melt-in-your-mouth minced mutton kebabs, crafted with secret royal spices.",
        },
      ],
      mainCourse: [
        {
          name: "The Royal Crown Dum Biryani",
          price: 420,
          description:
            "Fragrant long-grain basmati rice slow-cooked on dum with saffron and aromatic spices.",
        },
        {
          name: "Nazaqat Dal Bukhara",
          price: 290,
          description:
            "Black lentils slow-cooked overnight for 12 hours, finished with fresh butter and cream.",
        },
        {
          name: "Shahi Rogan Josh",
          price: 490,
          description:
            "Traditional Kashmiri mutton curry cooked in a rich, flavorful red gravy.",
        },
        {
          name: "Paneer Lababdar Regal",
          price: 360,
          description:
            "Soft paneer cubes simmered in a creamy, tomato-onion gravy with a hint of sweetness.",
        },
      ],
      breads: [
        {
          name: "Shahi Chur Chur Naan",
          price: 90,
        },
        {
          name: "Garlic Butter Naan",
          price: 80,
        },
        {
          name: "Roomali Roti",
          price: 50,
        },
      ],
      desserts: [
        {
          name: "Shahi Tukda Gold",
          price: 180,
          description:
            "Crispy fried bread soaked in saffron rabri, topped with silver leaf and nuts.",
        },
        {
          name: "Kesaria Elachi Kheer",
          price: 150,
          description:
            "Traditional slow-cooked rice pudding infused with cardamom and saffron.",
        },
      ],
    },
  },

  {
    name: "The Imperial Palace",
    phone: "7061767570",
    email: "imperialpalace17@gmail.com",
    address: "RDC CINEMA, Sector 5",
    openingTime: "10:00 AM",
    closingTime: "2:00 AM",
    openDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    closedDays: [],
    seatingOptions: [
      "indoor",
      "outdoor",
      "window",
      "private",
    ],
    cuisine: [
      "North Indian",
      "Mughlai",
      "Chinese",
      "Continental",
    ],
    priceForTwo: 2200,
    totalTables: 30,
    maximumCapacity: 120,
    averageTurnTime: 90,
    specialInfo: [
      "Live Music",
      "Private Dining Area",
      "Valet Parking",
      "Birthday and Party Booking",
      "Premium Royal Ambience",
      "Free Wi-Fi",
    ],
    menu: {
      starters: [
        {
          name: "Murgh Malai Tikka",
          price: 420,
          description:
            "Tender chicken pieces marinated in fresh cream, cheese and aromatic spices, grilled to perfection.",
        },
        {
          name: "Chicken Seekh Kebab",
          price: 400,
          description:
            "Juicy minced chicken kebabs prepared with traditional royal spices.",
        },
        {
          name: "Paneer Tikka",
          price: 350,
          description:
            "Fresh cottage cheese cubes marinated with Indian spices and grilled.",
        },
        {
          name: "Crispy Chilli Potato",
          price: 280,
          description:
            "Crispy potato fingers tossed with spicy chilli sauce and vegetables.",
        },
        {
          name: "Veg Spring Roll",
          price: 250,
          description:
            "Crispy rolls filled with fresh vegetables and served with special sauce.",
        },
      ],
      mainCourse: [
        {
          name: "Butter Chicken",
          price: 480,
          description:
            "Tender chicken cooked in a rich and creamy tomato butter gravy.",
        },
        {
          name: "Chicken Rogan Josh",
          price: 500,
          description:
            "Aromatic chicken curry cooked with traditional Mughlai spices.",
        },
        {
          name: "Shahi Paneer",
          price: 380,
          description:
            "Soft paneer cubes cooked in a rich royal creamy gravy.",
        },
        {
          name: "Dal Makhani",
          price: 320,
          description:
            "Slow-cooked black lentils prepared with butter and fresh cream.",
        },
        {
          name: "Veg Biryani",
          price: 350,
          description:
            "Fragrant basmati rice cooked with fresh vegetables and aromatic spices.",
        },
        {
          name: "Chicken Biryani",
          price: 450,
          description:
            "Premium basmati rice layered with tender chicken and royal spices.",
        },
      ],
      breads: [
        {
          name: "Butter Naan",
          price: 70,
        },
        {
          name: "Garlic Naan",
          price: 90,
        },
        {
          name: "Tandoori Roti",
          price: 40,
        },
      ],
      desserts: [
        {
          name: "Gulab Jamun",
          price: 150,
          description:
            "Soft traditional Indian sweet served warm.",
        },
        {
          name: "Royal Kesar Kulfi",
          price: 180,
          description:
            "Creamy kulfi flavored with saffron and dry fruits.",
        },
        {
          name: "Chocolate Brownie",
          price: 220,
          description:
            "Rich chocolate brownie served with a delicious chocolate sauce.",
        },
      ],
      beverages: [
        {
          name: "Fresh Lime Soda",
          price: 120,
        },
        {
          name: "Virgin Mojito",
          price: 180,
        },
        {
          name: "Cold Coffee",
          price: 200,
        },
        {
          name: "Mineral Water",
          price: 50,
        },
      ],
    },
  },

  {
    name: "The Grand Maharaja",
    phone: "7371936941",
    email: "grandmaharaja17@gmail.com",
    address: "City Center, Kolkata",
    openingTime: "11:00 AM",
    closingTime: "3:00 AM",
    openDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    closedDays: [],
    seatingOptions: [
      "indoor",
      "outdoor",
      "window",
      "private",
    ],
    cuisine: [
      "North Indian",
      "Mughlai",
      "Bengali",
      "Tandoori",
    ],
    priceForTwo: 2500,
    totalTables: 35,
    maximumCapacity: 150,
    averageTurnTime: 100,
    specialInfo: [
      "Live Ghazal Music",
      "Private Maharaja Dining Room",
      "Large Party Hall",
      "Valet Parking",
      "Birthday and Wedding Celebration Booking",
    ],
    menu: {
      starters: [
        {
          name: "Maharaja Chicken Tikka",
          price: 450,
          description:
            "Tender chicken marinated in royal spices and grilled in a traditional tandoor.",
        },
        {
          name: "Mutton Seekh Kebab",
          price: 520,
          description:
            "Juicy minced mutton kebabs prepared with aromatic Indian spices.",
        },
        {
          name: "Achari Paneer Tikka",
          price: 380,
          description:
            "Paneer cubes marinated with tangy pickle spices and grilled perfectly.",
        },
        {
          name: "Fish Amritsari",
          price: 420,
          description:
            "Crispy fried fish prepared with traditional Indian spices.",
        },
      ],
      mainCourse: [
        {
          name: "Maharaja Butter Chicken",
          price: 550,
          description:
            "Tender chicken cooked in a rich tomato, butter and cream gravy.",
        },
        {
          name: "Mutton Rogan Josh",
          price: 620,
          description:
            "Slow-cooked mutton prepared with Kashmiri spices and aromatic herbs.",
        },
        {
          name: "Shahi Paneer",
          price: 420,
          description:
            "Fresh paneer cooked in a creamy and flavorful royal gravy.",
        },
        {
          name: "Dal Maharani",
          price: 350,
          description:
            "Slow-cooked black lentils prepared with butter and fresh cream.",
        },
        {
          name: "Kolkata Chicken Biryani",
          price: 480,
          description:
            "Aromatic basmati rice layered with chicken, spices and potato.",
        },
        {
          name: "Veg Dum Biryani",
          price: 380,
          description:
            "Fragrant basmati rice cooked with vegetables and traditional spices.",
        },
      ],
      breads: [
        {
          name: "Butter Naan",
          price: 80,
        },
        {
          name: "Cheese Garlic Naan",
          price: 130,
        },
        {
          name: "Tandoori Roti",
          price: 50,
        },
      ],
      desserts: [
        {
          name: "Royal Gulab Jamun",
          price: 170,
        },
        {
          name: "Kesar Firni",
          price: 190,
        },
        {
          name: "Rabri Jalebi",
          price: 220,
        },
      ],
      beverages: [
        {
          name: "Mango Lassi",
          price: 150,
        },
        {
          name: "Masala Chaas",
          price: 100,
        },
        {
          name: "Virgin Mojito",
          price: 200,
        },
      ],
    },
  },

  {
    name: "Royal Dynasty",
    phone: "8250473619",
    email: "royaldynasty17@gmail.com",
    address: "EM Bypass, Ruby, Kolkata",
    openingTime: "12:00 PM",
    closingTime: "4:00 AM",
    openDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    closedDays: [],
    seatingOptions: [
      "indoor",
      "outdoor",
      "window",
      "private",
    ],
    cuisine: [
      "Chinese",
      "Thai",
      "Japanese",
      "Continental",
    ],
    priceForTwo: 2800,
    totalTables: 40,
    maximumCapacity: 180,
    averageTurnTime: 110,
    specialInfo: [
      "Rooftop Dining",
      "DJ Night on Weekends",
      "Private VIP Lounge",
      "Romantic Window Seating",
      "Corporate Party Booking",
      "Free Wi-Fi",
    ],
    menu: {
      starters: [
        {
          name: "Dynamite Chicken",
          price: 480,
          description:
            "Crispy chicken served with creamy spicy dynamite sauce.",
        },
        {
          name: "Chilli Garlic Prawns",
          price: 550,
          description:
            "Fresh prawns tossed with garlic, chilli and Asian spices.",
        },
        {
          name: "Crispy Corn",
          price: 320,
          description:
            "Golden crispy corn tossed with herbs and spices.",
        },
        {
          name: "Thai Spring Roll",
          price: 350,
          description:
            "Crispy rolls filled with vegetables and served with sweet chilli sauce.",
        },
      ],
      sushiAndSpecials: [
        {
          name: "California Sushi Roll",
          price: 550,
          description:
            "Fresh sushi roll prepared with vegetables and creamy filling.",
        },
        {
          name: "Spicy Chicken Sushi Roll",
          price: 600,
          description:
            "Fresh sushi with spicy chicken filling and special sauce.",
        },
        {
          name: "Thai Green Curry",
          price: 480,
          description:
            "Creamy Thai curry prepared with fresh vegetables and aromatic herbs.",
        },
      ],
      mainCourse: [
        {
          name: "Chicken Hakka Noodles",
          price: 380,
        },
        {
          name: "Veg Schezwan Fried Rice",
          price: 350,
        },
        {
          name: "Chilli Chicken",
          price: 450,
        },
        {
          name: "Kung Pao Chicken",
          price: 500,
        },
        {
          name: "Garlic Butter Fish",
          price: 550,
        },
      ],
      desserts: [
        {
          name: "Chocolate Lava Cake",
          price: 250,
        },
        {
          name: "Blueberry Cheesecake",
          price: 300,
        },
        {
          name: "Ice Cream Sundae",
          price: 220,
        },
      ],
      beverages: [
        {
          name: "Blue Lagoon",
          price: 220,
        },
        {
          name: "Virgin Pina Colada",
          price: 250,
        },
        {
          name: "Iced Tea",
          price: 180,
        },
      ],
    },
  },

  {
    name: "The Golden Table",
    phone: "9831125476",
    email: "goldentable17@gmail.com",
    address: "VIP Bazar, Kolkata",
    openingTime: "5:00 AM",
    closingTime: "10:00 PM",
    openDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    closedDays: [],
    seatingOptions: [
      "indoor",
      "outdoor",
      "window",
      "private",
    ],
    cuisine: [
      "Breakfast",
      "Cafe",
      "Continental",
      "Italian",
      "Indian",
    ],
    priceForTwo: 1600,
    totalTables: 28,
    maximumCapacity: 100,
    averageTurnTime: 75,
    specialInfo: [
      "Early Morning Breakfast Service",
      "Coffee Lounge",
      "Work-Friendly Seating",
      "Free Wi-Fi",
      "Outdoor Brunch Area",
      "Special Weekend Breakfast Menu",
    ],
    menu: {
      breakfast: [
        {
          name: "English Breakfast",
          price: 350,
          description:
            "Toast, eggs, sausage, hash browns and fresh juice.",
        },
        {
          name: "Masala Omelette",
          price: 180,
          description:
            "Fresh eggs prepared with onion, tomato and Indian spices.",
        },
        {
          name: "Pancake Stack",
          price: 250,
          description:
            "Soft pancakes served with chocolate and maple syrup.",
        },
        {
          name: "Aloo Paratha Combo",
          price: 220,
          description:
            "Stuffed paratha served with curd and pickle.",
        },
      ],
      starters: [
        {
          name: "Garlic Bread with Cheese",
          price: 220,
        },
        {
          name: "Golden French Fries",
          price: 180,
        },
        {
          name: "Chicken Popcorn",
          price: 280,
        },
        {
          name: "Veg Cheese Balls",
          price: 240,
        },
      ],
      mainCourse: [
        {
          name: "Chicken Alfredo Pasta",
          price: 420,
          description:
            "Creamy pasta prepared with grilled chicken and herbs.",
        },
        {
          name: "Veg Arrabbiata Pasta",
          price: 350,
          description:
            "Pasta cooked in a spicy tomato and herb sauce.",
        },
        {
          name: "Margherita Pizza",
          price: 400,
          description:
            "Classic pizza with cheese and tomato sauce.",
        },
        {
          name: "Chicken Supreme Pizza",
          price: 520,
          description:
            "Loaded pizza with chicken, cheese and vegetables.",
        },
        {
          name: "Veg Club Sandwich",
          price: 280,
        },
        {
          name: "Grilled Chicken Sandwich",
          price: 350,
        },
      ],
      desserts: [
        {
          name: "Belgian Waffle",
          price: 250,
        },
        {
          name: "Chocolate Brownie",
          price: 220,
        },
        {
          name: "Classic Tiramisu",
          price: 300,
        },
      ],
      beverages: [
        {
          name: "Cappuccino",
          price: 150,
        },
        {
          name: "Cold Coffee",
          price: 200,
        },
        {
          name: "Fresh Orange Juice",
          price: 180,
        },
        {
          name: "Chocolate Milkshake",
          price: 220,
        },
      ],
    },
  },
];

const seatingTypes = [
  "indoor",
  "outdoor",
  "window",
  "private",
];

function createTableCapacities(
  totalTables,
  maximumCapacity
) {
  const capacities = [];

  let remainingCapacity = maximumCapacity;

  for (let i = 0; i < totalTables; i++) {
    const tablesLeft = totalTables - i;

    let capacity;

    if (tablesLeft === 1) {
      capacity = remainingCapacity;
    } else {
      const average =
        Math.floor(
          remainingCapacity / tablesLeft
        );

      if (average <= 2) {
        capacity = 2;
      } else if (average <= 4) {
        capacity = 4;
      } else {
        capacity = 6;
      }
    }

    capacities.push(capacity);
    remainingCapacity -= capacity;
  }

  while (
    remainingCapacity > 0
  ) {
    for (
      let i = capacities.length - 1;
      i >= 0 && remainingCapacity > 0;
      i--
    ) {
      if (capacities[i] < 6) {
        capacities[i] += 2;
        remainingCapacity -= 2;
      }
    }
  }

  return capacities;
}

async function seedRestaurants() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log(
      "MongoDB connected successfully ✅"
    );

    console.log(
      "Clearing old restaurants and tables..."
    );

    await ReservationSafeDelete();

    await Table.deleteMany({});
    await Restaurant.deleteMany({});

    console.log(
      "Old restaurant and table data removed."
    );

    for (const restaurantData of restaurants) {
      const restaurant =
        await Restaurant.create(
          restaurantData
        );

      console.log(
        `Restaurant created: ${restaurant.name} ✅`
      );

      const capacities =
        createTableCapacities(
          restaurant.totalTables,
          restaurant.maximumCapacity
        );

      const tables = capacities.map(
        (capacity, index) => {
          let section;

          if (index % 10 === 0) {
            section = "private";
          } else if (index % 5 === 0) {
            section = "window";
          } else if (index % 3 === 0) {
            section = "outdoor";
          } else {
            section = "indoor";
          }

          let seatingType =
            "standard";

          if (section === "private") {
            seatingType = "sofa";
          } else if (
            capacity >= 6
          ) {
            seatingType = "booth";
          } else if (
            index % 7 === 0
          ) {
            seatingType = "bar";
          }

          return {
            restaurant:
              restaurant._id,

            tableNumber:
              index + 1,

            capacity,

            section,

            seatingType,

            status: "available",

            turnTime:
              restaurant.averageTurnTime,
          };
        }
      );

      await Table.insertMany(tables);

      console.log(
        `${tables.length} tables created for ${restaurant.name} 🪑`
      );
    }

    const restaurantCount =
      await Restaurant.countDocuments();

    const tableCount =
      await Table.countDocuments();

    console.log("");
    console.log(
      "===================================="
    );
    console.log(
      "NIVSSA DINE SEED COMPLETED ✅"
    );
    console.log(
      "===================================="
    );
    console.log(
      `Restaurants: ${restaurantCount}`
    );
    console.log(
      `Tables: ${tableCount}`
    );
    console.log(
      "===================================="
    );

    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.error(
      "Seed failed ❌"
    );

    console.error(
      error.message
    );

    await mongoose.disconnect();

    process.exit(1);
  }
}

async function ReservationSafeDelete() {
  try {
    const Reservation =
      require("./models/Reservation");

    await Reservation.deleteMany({});

    console.log(
      "Old reservations removed."
    );
  } catch (error) {
    console.log(
      "Reservation cleanup skipped:",
      error.message
    );
  }
}

seedRestaurants();