interface MockUser {
  userID: string;
  nickname: string;
  faceURL: string;
}

interface MockReadStatus {
  readCount: number;
  unreadCount: number;
  readUsers: MockUser[];
  unreadUsers: MockUser[];
}

export class MockMessageReadStatusService {
  private static mockUsers: MockUser[] = [
    { userID: "user1", nickname: "张三", faceURL: "" },
    { userID: "user2", nickname: "李四", faceURL: "" },
    { userID: "user3", nickname: "王五", faceURL: "" },
    { userID: "user4", nickname: "赵六", faceURL: "" },
    { userID: "user5", nickname: "钱七", faceURL: "" },
    { userID: "user6", nickname: "孙八", faceURL: "" },
    { userID: "user7", nickname: "周九", faceURL: "" },
    { userID: "user8", nickname: "吴十", faceURL: "" },
  ];

  static getMockReadStatus(clientMsgID: string): MockReadStatus {
    // 根据消息ID生成随机的已读状态
    const hash = clientMsgID.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    const totalUsers = 5 + (Math.abs(hash) % 4); // 5-8个成员
    const readCount = Math.abs(hash) % totalUsers;

    const selectedUsers = this.mockUsers.slice(0, totalUsers);
    const readUsers = selectedUsers.slice(0, readCount);
    const unreadUsers = selectedUsers.slice(readCount);

    return {
      readCount,
      unreadCount: totalUsers - readCount,
      readUsers,
      unreadUsers,
    };
  }
}
