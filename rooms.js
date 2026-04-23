async function renderRoomMatrix() {
    const { data: rooms } = await _supabase.from('rooms').select('room_number, status');
    const statusMap = Object.fromEntries((rooms || []).map(r => [r.room_number, r.status]));

    const wings = [ { id: 'apollo-grid', s: 1, e: 29 }, { id: 'helios-grid', s: 30, e: 58 } ];
    wings.forEach(w => {
        const grid = document.getElementById(w.id);
        if (!grid) return;
        grid.innerHTML = '';
        for (let f = 1; f <= 6; f++) {
            const row = document.createElement('div');
            row.className = 'floor-row';
            row.innerHTML = `<div class="floor-label">Floor ${f}</div>`;
            for (let r = w.s; r <= w.e; r++) {
                const num = (f * 100 + r).toString();
                const box = document.createElement('div');
                box.className = `room-box ${statusMap[num] || 'clean'}`;
                box.innerText = num.slice(-2);
                box.onclick = () => {
                    selectedRoom = num;
                    document.getElementById('modal-room-title').innerText = "Стая " + num;
                    document.getElementById('room-status-modal').style.display = 'flex';
                };
                row.appendChild(box);
            }
            grid.appendChild(row);
        }
    });
}

async function updateRoomStatus(newStatus) {
    await _supabase.from('rooms').update({ status: newStatus }).eq('room_number', selectedRoom);
    closeModal();
    renderRoomMatrix();
}