import phoenix as px
from phoenix.otel import register
from src import config


def init_instrumentation():
    """
    Initializes OpenTelemetry tracing with auto-instrumentation for Arize Phoenix.
    If running locally without an API Key, it will launch the local Phoenix server first.
    """
    # 1. Start local Phoenix server if endpoint is localhost and PHOENIX_API_KEY is not set
    if not config.PHOENIX_API_KEY and "localhost" in config.PHOENIX_COLLECTOR_ENDPOINT:
        print("\n[Phoenix] Starting local Arize Phoenix server...")
        try:
            # launch_app will spin up the server on port 6006 in a background thread if it isn't running
            session = px.launch_app()
            print(f"[Phoenix] Local Phoenix server launched at: {session.url}")
        except Exception as e:
            print(
                f"[Phoenix] Warning: Could not launch local server (it might already be running): {e}"
            )

    print(
        f"\n[Phoenix] Registering tracer for project: '{config.PHOENIX_PROJECT_NAME}'"
    )
    print(f"[Phoenix] Exporting traces to: {config.PHOENIX_COLLECTOR_ENDPOINT}")

    # 2. Register the OpenTelemetry TracerProvider
    # Setting auto_instrument=True automatically finds and instruments all installed
    # openinference-instrumentation-* packages (e.g. openinference-instrumentation-openai)
    tracer_provider = register(
        project_name=config.PHOENIX_PROJECT_NAME,
        endpoint=config.PHOENIX_COLLECTOR_ENDPOINT,
        api_key=config.PHOENIX_API_KEY if config.PHOENIX_API_KEY else None,
        auto_instrument=True,
    )

    print(
        "[Phoenix] Tracer successfully registered and auto-instrumentation activated."
    )
    return tracer_provider
