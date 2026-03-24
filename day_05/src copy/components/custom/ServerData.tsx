// 默认就是服务器组件
export default async function ServerData() {
  console.log("正在服务器读取秘密数据...");
  // 模拟读取数据库
  return (
    <div className="p-4 border bg-blue-50">
      <p>我是服务端组件，我直接读了数据库：Secret_12345</p>
      <p>我的代码不会发给浏览器。</p>
    </div>
  );
}
