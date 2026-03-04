<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Login</title>
    <style>
        body { font-family: Arial; max-width: 420px; margin: 60px auto; }
        input { width: 100%; padding: 10px; margin: 6px 0; }
        button { padding: 10px 14px; }
        .err { color: #b00020; margin: 10px 0; }
    </style>
</head>
<body>
    <h2>Login</h2>

    @if ($errors->any())
        <div class="err">
            @foreach ($errors->all() as $e)
                <div>{{ $e }}</div>
            @endforeach
        </div>
    @endif

    <form method="POST" action="{{ route('login.submit') }}">
        @csrf
        <input type="email" name="email" placeholder="Email" value="{{ old('email') }}" required>
        <input type="password" name="password" placeholder="Password" required>
        <button type="submit">Login</button>
    </form>
</body>
</html>