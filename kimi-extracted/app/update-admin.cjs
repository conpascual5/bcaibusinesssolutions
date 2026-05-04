
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection('mysql://Za2eBcCFHrZYwcU.root:74VBgLcfPqgUBEoccvMluFIgn72sUIj6@ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com:4000/19df0850-5e52-8420-8000-098ab2b61baa');

  // Update admin email
  const [result] = await conn.execute(
    "UPDATE users SET email = ? WHERE email = ?",
    ["conpascual5@gmail.com", "admin@bcai.com"]
  );

  if (result.affectedRows > 0) {
    console.log("Admin email updated to conpascual5@gmail.com");
  } else {
    // If no admin@bcai.com found, check if conpascual5 already exists
    const [rows] = await conn.execute("SELECT id FROM users WHERE email = ?", ["conpascual5@gmail.com"]);
    if (rows.length > 0) {
      console.log("Admin conpascual5@gmail.com already exists");
    } else {
      console.log("No admin user found to update");
    }
  }

  await conn.end();
})();
