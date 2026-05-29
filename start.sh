#!/bin/bash
echo "=== SupplyFlow - Бизнес процестерді басқару жүйесі ==="
echo ""

# Start backend
echo "[1/2] Backend іске қосылуда..."
cd "$(dirname "$0")/backend"
node dist/main.js &
BACKEND_PID=$!
sleep 3

# Start frontend
echo "[2/2] Frontend іске қосылуда..."
cd "$(dirname "$0")/frontend"
npx vite --host &
FRONTEND_PID=$!

echo ""
echo "=== Қосымша дайын! ==="
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:3001/api"
echo ""
echo "Кіру деректері:"
echo "  Админ: admin@supplyflow.kz / admin123"
echo "  Менеджер: manager1@supplyflow.kz / manager123"
echo "  Қоймашы: warehouse1@supplyflow.kz / warehouse123"
echo ""
echo "Тоқтату: kill $BACKEND_PID $FRONTEND_PID"
wait
