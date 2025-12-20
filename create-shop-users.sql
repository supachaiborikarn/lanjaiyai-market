-- สร้างบัญชีผู้ใช้สำหรับร้านค้าทุกร้าน
-- ใช้ชื่อร้านค้าเป็น username
-- ใช้เบอร์โทรเป็น password
-- สร้างเมื่อ: 2024-12-20

-- ตรวจสอบข้อมูลร้านค้าที่มีอยู่ก่อน
SELECT name, phone, stall_number FROM shops ORDER BY stall_number;

-- สร้าง users จากข้อมูล shops
-- หมายเหตุ: script นี้จะข้าม shops ที่มี user อยู่แล้ว (ตรวจสอบจาก shop_id ใน users table)

INSERT INTO users (username, password, role, shop_id, name)
SELECT 
    s.name as username,
    s.phone as password,
    'shop' as role,
    s.id as shop_id,
    s.owner_name as name
FROM shops s
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.shop_id = s.id
)
AND s.phone IS NOT NULL 
AND s.phone != '';

-- ตรวจสอบผลลัพธ์
SELECT 
    u.username,
    u.password,
    u.role,
    u.name,
    s.stall_number as แผง
FROM users u
JOIN shops s ON u.shop_id = s.id
WHERE u.role = 'shop'
ORDER BY s.stall_number;
