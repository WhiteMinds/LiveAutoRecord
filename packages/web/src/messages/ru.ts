export default {
  common: {
    unknown: 'Неизвестно',
    record_history: 'История',
    settings: 'Настройки',
    add: 'Добавить',
    apply: 'Применить',
    delete: 'Удалить',
    cancel: 'Отмена',
    reset: 'Сбросить',
    confirm: 'Подтвердить',
  },

  platform_name: {
    DouYu: 'DouYu - 斗鱼',
    Bilibili: 'Bilibili - 哔哩哔哩',
    HuYa: 'HuYa - 虎牙',
    DouYin: 'DouYin - 抖音',
  },

  quality: {
    lowest: 'Самое низкое',
    low: 'Низкое',
    medium: 'Среднее',
    high: 'Высокое',
    highest: 'Самое высокое',
  },

  recorders: {
    sort: 'Сортировка',
    filter: 'Фильтр',
    add_channel: 'Добавить',
    added_time: 'Добавлено время',
  },

  recorder: {
    platform: 'Платформа',
    channel: 'Канал',
    state: 'Состояние',
    remarks: 'Примечания',
    quality: 'Качество записи',
    stream_priority: 'Приоритет видеопотока',
    source_priority: 'Приоритет источника видео',
    ffmpeg_args_tip: 'Нажмите, чтобы просмотреть параметры записи',
    ffmpeg_args: 'Параметры записи FFMPEG',
    disable: 'Отключить',
    disable_auto_check: 'Отключить автоматическую запись',
    refresh: 'Обновить',
    stop: 'Остановить',
    history: 'История',
    state_idle: 'Свободен',
    state_recording: 'Запись',
    'state_stopping-record': 'Остановка записи',
  },

  edit: {
    create_title: 'Добавление новой записи',
    edit_title: 'Редактирование записи',
    channel_input_hint:
      'Введите идентификатор канала или полный URL, и URL будет автоматически разобран на идентификатор канала при обнаружении',
    quality_input_hint:
      'В соответствии с установленным качеством изображения автоматически выбирается соответствующий видеопоток',
    stream_priority_input_hint:
      'При записи попробуйте выбрать указанный поток в порядке переднего и заднего и игнорировать настройку качества изображения при успешном выполнении',
    source_priority_input_hint: 'При записи попробуйте выбрать указанный источник в порядке переднего и заднего',
    parse_state_parsing: 'Разбор',
    parse_state_error: 'Нет платформы, соответствующей URL',
    parse_state_parsed: 'Разбор зав',
    waiting_for_parsing: 'Ожидание разбора',
  },

  settings: {
    global_recording_settings: 'Глобальные настройки записи',
    save_path_rule: 'Правило сохранения пути',
    auto_remove_reserved_chars: 'Автоматически удалить системные зарезервированные символы',
    spr_alert_title: 'Как использовать переменные в пути сохранения?',
    spr_alert_subtitle: "Оберните имя переменной в `{'{}'}`, чтобы использовать его, например `/path/{'{platform}'}`",
    filed_name: 'Имя переменной',
    filed_value: 'Значение переменной',
    field_platform_hint: 'Имя записываемой платформы, например `Bilibili`',
    field_channel_hint: 'Идентификатор записываемого канала, например `196`',
    field_title_hint: 'Название канала, например `Добрый вечер~`',
    field_owner_hint: 'Имя владельца канала, например `Xiaoyuan`',
    field_remarks_hint: 'Примечания канала, пользовательское значение',
    field_year_hint: 'Год начала записи, например `2020`',
    field_month_hint: 'Месяц начала записи, например `01`',
    field_date_hint: 'День начала записи, например `15`',
    field_hour_hint: 'Час начала записи, например `23`',
    field_min_hint: 'Минута начала записи, например `30`',
    field_sec_hint: 'Секунда начала записи, например `59`',
    ffmpeg_output_args: 'Параметры вывода FFMPEG',
    auto_check_and_record: 'Автоматическая проверка и запись',
    check_interval: 'Интервал проверки (мс)',
    app_settings: 'Настройки приложения',
    default_notice_format: "Канал {'{channelId}'} начал запись",
    close_to_tray: 'Закрыть в трей',
    auto_generate_srt: 'Автоматически создавать файл субтитров SRT при завершении записи',
    auto_remove_empty_record: 'Автоматически удалять записи с нулевым размером',
    notify_when_record_start: 'Уведомлять о начале записи',
    notice_format: 'Формат уведомления',
    nf_alert_title: 'Как использовать переменные в формате уведомления?',
    nf_alert_subtitle:
      "Оберните имя переменной в `{'{}'}` чтобы использовать его, например `Канал {'{channelId}'} начал запись`",
    debug_mode: 'Режим отладки',
    about: 'О программе',
    version: 'Версия',
    open_source: 'Открытый исходный код',
    feedback: 'Обратная связь',
    author: 'Автор',
    email: 'Электронная почта',
  },

  records: {
    record_history: 'История записей',
    clean_invalid_record: 'Очистить недействительные записи',
    note: 'Примечание',
    clean_invalid_record_tip:
      'Это удалит все записи видеофайлов, которые были удалены, включая файлы до фильтрации поиска.',
    search: 'Поиск',
    field_start_time: 'Время начала записи',
    field_end_time: 'Время окончания записи',
    field_duration: 'Продолжительность записи',
    field_path: 'Путь',
    field_action: 'Действие',
    file_not_exists: 'Файл не существует',
    play: 'Воспроизвести',
    generate_srt: 'Создать SRT субтитры',
    invalid_record_removed: 'Всего удалено {count} недействительных записей',
  },
}
