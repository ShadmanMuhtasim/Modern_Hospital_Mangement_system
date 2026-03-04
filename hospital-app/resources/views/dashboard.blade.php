<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Dashboard</title>
    <style>
        body { font-family: Arial; max-width: 700px; margin: 60px auto; }
        .card { padding: 16px; border: 1px solid #ddd; border-radius: 10px; }
        .muted { color: #666; }
    </style>
</head>
<body>
    <h2>Dashboard</h2>

    <div class="card">
        <div><b>User ID:</b> {{ auth()->user()->user_id }}</div>
        <div><b>Name:</b> {{ auth()->user()->full_name }}</div>
        <div><b>Email:</b> {{ auth()->user()->email }}</div>
        <div class="muted"><b>Status:</b> {{ auth()->user()->account_status }}</div>

        <form method="POST" action="{{ route('logout') }}" style="margin-top:16px;">
            @csrf
            <button type="submit">Logout</button>
        </form>
    </div>
</body>
</html>