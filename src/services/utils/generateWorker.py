import random

PROJECTS = [
    "klcc-tower",
    "pj-residences",
    "cyberjaya-techpark",
    "penang-waterfront",
    "jb-logistics-hub",
    "kl-sentral-expansion",
    "shah-alam-industrial",
    "subang-commercial"
]

ROLES = [
    "Project Manager",
    "Site Manager",
    "Site Engineer",
    "Civil Engineer",
    "Structural Engineer",
    "MEP Engineer",
    "Quantity Surveyor",
    "Safety Officer",
    "Site Supervisor",
    "Foreman",
    "Construction Worker",
    "Electrician",
    "Plumber",
    "Machinery Operator",
    "Document Controller",
    "Procurement Officer",
    "HR Executive",
    "Finance Executive"
]

FIRST_NAMES = [
    "Muhammad", "Ahmad", "Aiman", "Amirul", "Hakim",
    "Khairul", "Firdaus", "Syafiq", "Hafiz", "Azlan",
    "Roslan", "Harith", "Aqil", "Danish", "Faiz",
    "Nurul", "Siti", "Aisyah", "Farah", "Nabila",
    "Sabrina", "Hidayah", "Syazana", "Izzati", "Amirah",
    "Wei Jian", "Jia Hui", "Chee Meng", "Mei Ling", "Jun Hao",
    "Wen Jie", "Yu Xuan", "Kok Leong", "Xin Yi", "Jia Xin",
    "Raj", "Prem", "Arun", "Ganesh", "Vignesh",
    "Kavitha", "Shanti", "Pravin", "Surya", "Kumar"
]

LAST_NAMES = [
    "Rahman", "Ismail", "Hassan", "Hamdan", "Anuar",
    "Razak", "Yusof", "Zulkifli", "Salleh", "Mahmud",
    "Lim", "Tan", "Lee", "Wong", "Ng",
    "Ong", "Teoh", "Chong", "Yap", "Low",
    "Kumar", "Raj", "Singh", "Devi", "Nair",
    "Subramaniam", "Pillai", "Patel"
]

PHONE_PREFIXES = [
    "010", "011", "012", "013",
    "014", "016", "017", "018", "019"
]

team_members = []

# Project Director
team_members.append({
    "id": "tm1",
    "name": "Ahmad Faiz Rahman",
    "role": "Project Director",
    "email": "ahmad.faiz.rahman@syncfield.my",
    "phone": "+60 12-3456-7890",
    "avatarUrl": "",
    "status": "active",
    "projectIds": ["klcc-tower", "pj-residences"]
})

manager_pool = ["tm1"]

for i in range(2, 101):
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)

    name = f"{first} {last}"

    role = random.choices(
        population=ROLES,
        weights=[
            4,  # Project Manager
            5,  # Site Manager
            8,  # Site Engineer
            8,  # Civil Engineer
            4,  # Structural Engineer
            4,  # MEP Engineer
            5,  # QS
            4,  # Safety
            8,  # Supervisor
            8,  # Foreman
            25, # Worker
            4,  # Electrician
            3,  # Plumber
            2,  # Operator
            2,  # Document
            2,  # Procurement
            2,  # HR
            2   # Finance
        ],
        k=1
    )[0]

    email = (
        f"{first.lower().replace(' ', '')}."
        f"{last.lower().replace(' ', '')}"
        f"{random.randint(1,999)}@syncfield.my"
    )

    prefix = random.choice(PHONE_PREFIXES)
    phone = (
        f"+60 {prefix[1:]}"
        f"-{random.randint(1000,9999)}"
        f"-{random.randint(1000,9999)}"
    )

    status = random.choices(
        ["active", "on_leave"],
        weights=[92, 8],
        k=1
    )[0]

    project_count = random.randint(1, 3)
    projects = random.sample(PROJECTS, project_count)

    manager_id = random.choice(manager_pool)

    member = {
        "id": f"tm{i}",
        "name": name,
        "role": role,
        "email": email,
        "phone": phone,
        "avatarUrl": "",
        "status": status,
        "projectIds": projects,
        "managerId": manager_id
    }

    team_members.append(member)

    if role in [
        "Project Manager",
        "Site Manager",
        "Site Supervisor",
        "Foreman"
    ]:
        manager_pool.append(f"tm{i}")

print("export const teamMembers: TeamMember[] = [")

for member in team_members:
    projects_str = ", ".join(
        [f'"{p}"' for p in member["projectIds"]]
    )

    manager_str = (
        f', managerId: "{member["managerId"]}"'
        if "managerId" in member
        else ""
    )

    print(
        f'  {{ '
        f'id: "{member["id"]}", '
        f'name: "{member["name"]}", '
        f'role: "{member["role"]}", '
        f'email: "{member["email"]}", '
        f'phone: "{member["phone"]}", '
        f'avatarUrl: "", '
        f'status: "{member["status"]}", '
        f'projectIds: [{projects_str}]'
        f'{manager_str}'
        f' }},'
    )

print("];")