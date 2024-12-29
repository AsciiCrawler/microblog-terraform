data "archive_file" "default_file" {
  type        = "zip"
  source_dir  = "${path.root}/${var.function_folder_path}/dist"
  output_path = "${path.root}/${var.function_folder_path}/dist/index.zip"
}

resource "aws_s3_object" "register_lambda_s3_object" {
  bucket = var.bucket_id
  key    = "${var.function_folder_path}/dist/index.zip"
  source = data.archive_file.default_file.output_path
  etag   = filemd5(data.archive_file.default_file.output_path)
}