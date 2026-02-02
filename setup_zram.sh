#!/bin/bash

# Скрипт для настройки zram swap
# Запустите с sudo: sudo bash setup_zram.sh

set -e

echo "=== Настройка zram swap ==="

# Получаем размер RAM в байтах
RAM_SIZE=$(free -b | awk '/^Mem:/{print $2}')
# Используем 50% от RAM для zram (можно изменить)
ZRAM_SIZE=$((RAM_SIZE / 2))

echo "Размер RAM: $(numfmt --to=iec-i --suffix=B $RAM_SIZE)"
echo "Размер zram: $(numfmt --to=iec-i --suffix=B $ZRAM_SIZE)"

# Загружаем модуль zram
echo "Загрузка модуля zram..."
modprobe zram || {
    echo "Ошибка: не удалось загрузить модуль zram"
    exit 1
}

# Проверяем, есть ли уже zram устройства
EXISTING_ZRAM=$(zramctl --find --size $ZRAM_SIZE 2>/dev/null || echo "")

if [ -z "$EXISTING_ZRAM" ]; then
    # Создаем новое zram устройство
    echo "Создание zram устройства..."
    ZRAM_DEVICE=$(zramctl --find --size $ZRAM_SIZE)
    echo "Создано устройство: $ZRAM_DEVICE"
else
    ZRAM_DEVICE=$EXISTING_ZRAM
    echo "Используется существующее устройство: $ZRAM_DEVICE"
fi

# Настраиваем алгоритм сжатия (lz4 обычно быстрее всего)
echo "Настройка алгоритма сжатия lz4..."
zramctl --algorithm lz4 $ZRAM_DEVICE || zramctl --algorithm lzo $ZRAM_DEVICE

# Форматируем как swap
echo "Форматирование как swap..."
mkswap $ZRAM_DEVICE

# Включаем swap
echo "Включение zram swap..."
swapon $ZRAM_DEVICE --priority 100

# Показываем статус
echo ""
echo "=== Статус zram ==="
zramctl
echo ""
echo "=== Статус swap ==="
swapon --show

# Создаем systemd unit для автоматической загрузки при старте
echo ""
echo "Создание systemd unit для автозагрузки..."
cat > /etc/systemd/system/zram-setup.service << EOF
[Unit]
Description=Setup zram swap device
After=local-fs.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/bash -c 'modprobe zram && ZRAM_DEV=\$(zramctl --find --size $ZRAM_SIZE) && zramctl --algorithm lz4 \$ZRAM_DEV || zramctl --algorithm lzo \$ZRAM_DEV && mkswap \$ZRAM_DEV && swapon \$ZRAM_DEV --priority 100'
ExecStop=/bin/bash -c 'ZRAM_DEV=\$(zramctl --find --size $ZRAM_SIZE) && swapoff \$ZRAM_DEV && zramctl --reset \$ZRAM_DEV'

[Install]
WantedBy=multi-user.target
EOF

# Включаем сервис
systemctl daemon-reload
systemctl enable zram-setup.service

echo ""
echo "=== Готово! ==="
echo "zram swap настроен и будет автоматически загружаться при перезагрузке."
echo "Текущий статус:"
free -h
