import { useState } from "react";  
import { ChevronLeft } from "lucide-react";  
  
interface Employee {  
  id: string;  
  name: string;  
  portrait?: string;  
}  
  
interface Department {  
  id: string;  
  name: string;  
  portrait?: string;  
  employees: Employee[];  
}  
  
const mockData: Department[] = [  
  {  
    id: "1",  
    name: "公司领导部门",  
    employees: [  
      { id: "e1", name: "张总", portrait: "" },  
      { id: "e2", name: "李总", portrait: "" },  
    ],  
  },  
  {  
    id: "2",  
    name: "研发部门",  
    employees: [  
      { id: "e3", name: "王工程师", portrait: "" },  
      { id: "e4", name: "赵工程师", portrait: "" },  
      { id: "e5", name: "刘工程师", portrait: "" },  
    ],  
  },  
  {  
    id: "3",  
    name: "财务部门",  
    employees: [  
      { id: "e6", name: "陈会计", portrait: "" },  
      { id: "e7", name: "周会计", portrait: "" },  
    ],  
  },  
];  
  
export const organizationalStructure = () => {  
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);  
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);  
  
  return (  
    <div className="flex h-full w-full flex-col bg-white">  
      <div className="m-5.5 flex flex-row items-center justify-between border-b border-gray-200 pb-4">  
        {selectedDept && (  
          <button  
            onClick={() => setSelectedDept(null)}  
            className="flex items-center text-blue-600 hover:text-blue-700"  
          >  
            <ChevronLeft className="h-5 w-5" />  
            <span className="ml-1">返回部门列表</span>  
          </button>  
        )}  
        <p className="text-base font-extrabold">  
          {selectedDept ? selectedDept.name : "组织架构"}  
        </p>  
        <div className="w-24" />  
      </div>  
  
      <div className="box-border flex-1 overflow-y-auto px-2 pb-3">  
        {!selectedDept ? (  
          <ul className="space-y-2">  
            {mockData.map((dept) => (  
              <li key={dept.id}>  
                <div className="flex items-center rounded-lg p-4 hover:bg-gray-100 transition-colors">  
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-blue-600 font-semibold">  
                    {dept.name.charAt(0)}  
                  </div>  
                  <p className="ml-3 flex-1 text-sm font-medium">{dept.name}</p>  
                  <button  
                    onClick={() => setSelectedDept(dept)}  
                    className="rounded-md px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 transition-colors"  
                  >  
                    展开  
                  </button>  
                </div>  
              </li>  
            ))}  
          </ul>  
        ) : (  
          <ul className="space-y-2">  
            {selectedDept.employees.map((employee) => (  
              <li key={employee.id}>  
                <div  
                  onClick={() => setSelectedEmployee(employee.id)}  
                  className={`flex items-center rounded-lg p-4 cursor-pointer transition-colors ${  
                    selectedEmployee === employee.id  
                      ? "bg-blue-50 border-2 border-blue-500"  
                      : "hover:bg-gray-100"  
                  }`}  
                >  
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold">  
                    {employee.name.charAt(0)}  
                  </div>  
                  <p className="ml-3 text-sm font-medium">{employee.name}</p>  
                </div>  
              </li>  
            ))}  
          </ul>  
        )}  
      </div>  
    </div>  
  );  
};