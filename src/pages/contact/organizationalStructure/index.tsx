import { useState, useEffect } from "react";
import { ChevronLeft, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

// 接口返回类型定义（与后端响应匹配）
interface DeptTreeItem {
  id: string;
  deptId: number;
  label: string;
  deptLevel: string;
  children?: DeptTreeItem[];
}

interface DeptTreeResponse {
  msg: string;
  code: number;
  data: DeptTreeItem[];
}

interface Employee {
  id: string;
  userId: number;
  userName: string;
  portrait?: string; // 保留原字段，适配现有UI
}

interface DeptUserResponse {
  msg: string;
  code: number;
  data: Employee[];
}

// 递归处理部门树，添加展开状态
interface DeptNode extends DeptTreeItem {
  isExpanded?: boolean; // 控制子部门展开/折叠
}

export const OrganizationalStructure = () => {
  const [deptTree, setDeptTree] = useState<DeptNode[]>([]); // 部门树数据
  const [selectedDept, setSelectedDept] = useState<DeptNode | null>(null); // 当前选中部门
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null); // 当前选中员工
  const [employees, setEmployees] = useState<Employee[]>([]); // 部门下员工列表
  const [loading, setLoading] = useState<boolean>(false); // 加载状态
  const [error, setError] = useState<string | null>(null); // 错误信息

  // 接口地址配置
  const API_CONFIG = {
    deptTree: "http://172.17.165.136:8080/system/dept/treeList",
    deptUsers: (deptId: number) =>
      `http://172.17.165.136:8080/system/dept/deptUserList/${deptId}`,
  };

  // 1. 获取部门树数据
  const fetchDeptTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_CONFIG.deptTree, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 若需要认证token，添加到headers中
          // "Authorization": "Bearer " + localStorage.getItem("token"),
        },
        // POST请求体（如果后端需要参数，可在这里添加）
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`网络错误: ${response.status}`);
      }

      const result: DeptTreeResponse = await response.json();

      if (result.code === 200) {
        // 递归处理部门树，添加默认展开状态（根部门默认展开）
        const formattedTree = formatDeptTree(result.data);
        setDeptTree(formattedTree);
      } else {
        throw new Error(`接口错误: ${result.msg}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取部门树失败");
      console.error("部门树请求失败:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. 获取指定部门下的员工列表
  const fetchDeptEmployees = async (deptId: number) => {
    if (!deptId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_CONFIG.deptUsers(deptId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // 若需要认证token，添加到headers中
          // "Authorization": "Bearer " + localStorage.getItem("token"),
        },
      });

      if (!response.ok) {
        throw new Error(`网络错误: ${response.status}`);
      }

      const result: DeptUserResponse = await response.json();

      if (result.code === 200) {
        setEmployees(result.data);
        setSelectedEmployee(null); // 重置选中员工
      } else {
        throw new Error(`接口错误: ${result.msg}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取员工列表失败");
      console.error("员工列表请求失败:", err);
    } finally {
      setLoading(false);
    }
  };

  // 格式化部门树：添加展开状态，根部门默认展开
  const formatDeptTree = (tree: DeptTreeItem[]): DeptNode[] => {
    return tree.map((node) => ({
      ...node,
      isExpanded: node.deptLevel === "0", // 根部门默认展开（可根据需求调整）
      children: node.children ? formatDeptTree(node.children) : undefined,
    }));
  };

  // 关键修复：给递归函数添加显式返回类型 DeptNode[]
  const toggleDeptExpand = (nodeId: string, isCurrentExpanded: boolean) => {
    // 明确声明返回类型为 DeptNode[]
    const updateExpandStatus = (tree: DeptNode[]): DeptNode[] => {
      return tree.map((node) => {
        if (node.id === nodeId) {
          return { ...node, isExpanded: !isCurrentExpanded };
        }
        if (node.children) {
          return { ...node, children: updateExpandStatus(node.children) };
        }
        return node;
      });
    };

    setDeptTree(updateExpandStatus(deptTree));
  };

  // 点击部门：如果有子部门则切换展开状态，否则加载员工列表
  const handleDeptClick = (dept: DeptNode) => {
    if (dept.children && dept.children.length > 0) {
      // 有子部门，切换展开/折叠
      toggleDeptExpand(dept.id, dept.isExpanded ?? false);
    } else {
      // 无子部门，加载员工列表
      setSelectedDept(dept);
      fetchDeptEmployees(dept.deptId);
    }
  };

  // 递归渲染部门树（支持多层级）
  const renderDeptTree = (tree: DeptNode[]) => {
    return (
      <ul className="space-y-1 pl-2">
        {tree.map((dept) => (
          <li key={dept.id}>
            <div
              className="flex cursor-pointer items-center rounded-lg p-3 transition-colors hover:bg-gray-100"
              onClick={() => handleDeptClick(dept)}
            >
              {/* 展开/折叠图标 */}
              {dept.children && dept.children.length > 0 ? (
                dept.isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )
              ) : (
                <div className="w-4" /> // 无子部门时占位，保持对齐
              )}

              {/* 部门图标 */}
              <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-md bg-blue-100 font-semibold text-blue-600">
                {dept.label.charAt(0)}
              </div>

              {/* 部门名称 */}
              <p className="ml-2 flex-1 text-sm font-medium">{dept.label}</p>

              {/* 查看员工按钮（只有无子部门时显示） */}
              {!dept.children || dept.children.length === 0 ? (
                <button
                  className="rounded-md px-2 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation(); // 防止触发父级点击事件
                    setSelectedDept(dept);
                    fetchDeptEmployees(dept.deptId);
                  }}
                >
                  查看员工
                </button>
              ) : null}
            </div>

            {/* 渲染子部门（展开状态下） */}
            {dept.isExpanded &&
              dept.children &&
              dept.children.length > 0 &&
              renderDeptTree(dept.children)}
          </li>
        ))}
      </ul>
    );
  };

  // 组件挂载时获取部门树
  useEffect(() => {
    console.log("组件挂载，获取部门树");
    fetchDeptTree();
  }, []);

  // 返回部门列表
  const handleBack = () => {
    setSelectedDept(null);
    setEmployees([]);
    setSelectedEmployee(null);
  };

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {/* 顶部导航栏 */}
      <div className="m-5.5 flex flex-row items-center justify-between border-b border-gray-200 pb-4">
        {selectedDept && (
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="ml-1">返回部门列表</span>
          </button>
        )}
        <p className="text-base font-extrabold">
          {selectedDept ? `${selectedDept.label} - 员工列表` : "组织架构"}
        </p>
        <div className="w-24" />
      </div>

      {/* 内容区域 */}
      <div className="box-border flex-1 overflow-y-auto px-2 pb-3">
        {/* 加载状态 */}
        {loading && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-500">加载中...</span>
          </div>
        )}

        {/* 错误状态 */}
        {error && !loading && (
          <div className="flex h-40 items-center justify-center text-red-500">
            <span>{error}</span>
            <button
              onClick={() =>
                selectedDept ? fetchDeptEmployees(selectedDept.deptId) : fetchDeptTree()
              }
              className="ml-3 text-blue-600 hover:underline"
            >
              重试
            </button>
          </div>
        )}

        {/* 无数据状态 */}
        {!loading && !error && deptTree.length === 0 && !selectedDept && (
          <div className="flex h-40 items-center justify-center text-gray-500">
            暂无部门数据
          </div>
        )}

        {/* 部门树列表（未选中部门时） */}
        {!selectedDept && !loading && !error && deptTree.length > 0 && (
          <div className="px-3 py-2">{renderDeptTree(deptTree)}</div>
        )}

        {/* 员工列表（选中部门时） */}
        {selectedDept && !loading && !error && (
          <ul className="space-y-2 px-3 py-2">
            {employees.length > 0 ? (
              employees.map((employee) => (
                <li key={employee.id}>
                  <div
                    onClick={() => setSelectedEmployee(employee.id)}
                    className={`flex cursor-pointer items-center rounded-lg p-4 transition-colors ${
                      selectedEmployee === employee.id
                        ? "border-2 border-blue-500 bg-blue-50"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-semibold text-gray-600">
                      {employee.userName.charAt(0)}
                    </div>
                    <p className="ml-3 text-sm font-medium">{employee.userName}</p>
                  </div>
                </li>
              ))
            ) : (
              <div className="flex h-40 items-center justify-center text-gray-500">
                该部门暂无员工
              </div>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};
