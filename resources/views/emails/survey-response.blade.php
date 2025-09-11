<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Survey Response</title>
</head>
<body>
    <p>A new response was submitted for "{{ $survey->title }}".</p>
    <p>
        View response:
        <a href="{{ route('surveys.responses.show', [$survey->id, $response->id]) }}">{{ route('surveys.responses.show', [$survey->id, $response->id]) }}</a>
    </p>
</body>
</html>
